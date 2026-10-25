// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Preview } from "../src/parent/Preview";
import { useRunner, type ConsoleEntry } from "../src/parent/useRunner";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let latest: ReturnType<typeof useRunner>;
const onRun = vi.fn();
let held = false;

function Harness({ code }: { code: string }) {
  latest = useRunner("runner.html", code, { held, onRun });
  return <Preview src="runner.html" iframeKey={latest.iframeKey} iframeRef={latest.iframeRef} slot={null} />;
}

let container: HTMLDivElement;
let root: Root;

const render = (code: string) => act(() => root.render(<Harness code={code} />));
const iframe = () => latest.iframeRef.current as HTMLIFrameElement;
const send = (data: unknown, source: MessageEventSource | null = iframe().contentWindow) =>
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, source }));
  });
const texts = (entries: ConsoleEntry[]) => entries.map(entry => entry.text);

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  held = false;
  onRun.mockClear();
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe("useRunner", () => {
  it("remounts the iframe once, after the delay, for rapid code changes", async () => {
    await render("a");
    const first = iframe();
    await render("b");
    await act(() => vi.advanceTimersByTimeAsync(100));
    await render("c");
    await act(() => vi.advanceTimersByTimeAsync(499));
    expect(latest.iframeKey).toBe(0);
    expect(iframe()).toBe(first);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(latest.iframeKey).toBe(1);
    expect(iframe()).not.toBe(first);
  });

  it("posts the latest code to the current iframe when it is ready", async () => {
    await render("a");
    await render("b");
    await act(() => vi.advanceTimersByTimeAsync(500));
    const post = vi.spyOn(iframe().contentWindow as Window, "postMessage");
    await send({ type: "ready" });
    expect(post).toHaveBeenCalledExactlyOnceWith({ type: "run", runId: 2, code: "b" }, "*");
  });

  it("calls onRun right before it posts a run", async () => {
    await render("a");
    const post = vi.spyOn(iframe().contentWindow as Window, "postMessage");
    post.mockImplementation(() => expect(onRun).toHaveBeenCalledOnce());
    await send({ type: "ready" });
    expect(post).toHaveBeenCalledOnce();
  });

  it("holds the first run back until the code changes", async () => {
    held = true;
    await render("a");
    const first = vi.spyOn(iframe().contentWindow as Window, "postMessage");
    await send({ type: "ready" });
    expect(first).not.toHaveBeenCalled();
    expect(onRun).not.toHaveBeenCalled();
    await render("b");
    await act(() => vi.advanceTimersByTimeAsync(500));
    const second = vi.spyOn(iframe().contentWindow as Window, "postMessage");
    await send({ type: "ready" });
    expect(second).toHaveBeenCalledExactlyOnceWith({ type: "run", runId: 2, code: "b" }, "*");
  });

  it("restarts in a fresh iframe on request, also with unchanged code", async () => {
    held = true;
    await render("a");
    await send({ type: "console", runId: 1, level: "log", text: "old" });
    const first = iframe();
    await act(() => latest.restart("a"));
    expect(latest.iframeKey).toBe(1);
    expect(iframe()).not.toBe(first);
    expect(latest.entries).toEqual([]);
    const post = vi.spyOn(iframe().contentWindow as Window, "postMessage");
    await send({ type: "ready" });
    expect(post).toHaveBeenCalledExactlyOnceWith({ type: "run", runId: 2, code: "a" }, "*");
  });

  it("does not run again when the code changes to the restarted code", async () => {
    await render("a");
    await render("b");
    await act(() => latest.restart("a"));
    await render("a");
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(latest.iframeKey).toBe(1);
  });

  it("ignores ready from another window", async () => {
    await render("a");
    const post = vi.spyOn(iframe().contentWindow as Window, "postMessage");
    await send({ type: "ready" }, window);
    expect(post).not.toHaveBeenCalled();
  });

  it("drops console messages from another window or with an old run id", async () => {
    await render("a");
    await send({ type: "console", runId: 1, level: "log", text: "kept" });
    await send({ type: "console", runId: 1, level: "log", text: "other window" }, window);
    await send({ type: "console", runId: 0, level: "log", text: "stale" });
    await send({ type: "console", runId: 1, level: "bogus", text: "unknown" });
    expect(texts(latest.entries)).toEqual(["kept"]);
  });

  it("clears entries on a new run and drops the previous run's messages", async () => {
    await render("a");
    await send({ type: "console", runId: 1, level: "warn", text: "old" });
    await render("b");
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(latest.entries).toEqual([]);
    await send({ type: "console", runId: 1, level: "log", text: "late" });
    await send({ type: "console", runId: 2, level: "error", text: "new" });
    expect(latest.entries).toEqual([{ level: "error", text: "new" }]);
  });

  it("tells the reader when the runner does not start", async () => {
    await render("a");
    await act(() => vi.advanceTimersByTimeAsync(4999));
    expect(latest.entries).toEqual([]);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(latest.entries).toEqual([{ level: "system", text: "The preview did not start." }]);
    await render("b");
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(latest.entries).toEqual([]);
  });

  it("stays quiet when the runner is ready in time", async () => {
    await render("a");
    await send({ type: "ready" });
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(latest.entries).toEqual([]);
  });

  it("keeps only the last 500 entries", async () => {
    await render("a");
    for (let index = 1; index <= 501; index += 1) {
      await send({ type: "console", runId: 1, level: "log", text: String(index) });
    }
    expect(latest.entries).toHaveLength(500);
    expect(latest.entries[0].text).toBe("2");
    expect(latest.entries[499].text).toBe("501");
  });
});
