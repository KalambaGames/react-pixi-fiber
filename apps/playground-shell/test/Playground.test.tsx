// @vitest-environment jsdom
import { EditorView } from "codemirror";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Example, Playground, withConsoleSize } from "../src/parent/Playground";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// CodeMirror measures text ranges, which jsdom does not lay out.
Range.prototype.getClientRects = () => ({ item: () => null, length: 0, [Symbol.iterator]: [][Symbol.iterator] });

const examples: Example[] = [
  {
    code: "code",
    configure: { code: "configure();", summary: "React 19 and PixiJS 8" },
    group: "Scene Objects",
    id: "first",
    runner: "runner.html",
    title: "First",
  },
];

let container: HTMLDivElement;
let root: Root;
let mediaListeners: (() => void)[];

const setWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  act(() => {
    for (const listener of mediaListeners) listener();
  });
};
const render = async () => {
  await act(async () => root.render(<Playground examples={examples} pixiMajor={8} />));
};
const log = () => container.querySelector("[role=log]")?.textContent ?? "";

beforeEach(() => {
  localStorage.clear();
  mediaListeners = [];
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      addEventListener: (_: string, listener: () => void) => {
        if (query.includes("max-width")) mediaListeners.push(listener);
      },
      matches: false,
      removeEventListener: () => {},
    }))
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      disconnect() {}
      observe() {}
      unobserve() {}
    }
  );
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
  window.history.replaceState(null, "", "#first");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Playground", () => {
  it("renders when storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("sandboxed", "SecurityError");
    });
    await render();
    expect(container.querySelector("iframe")).not.toBeNull();
  });

  it("renders when saved panel sizes are corrupt", async () => {
    localStorage.setItem("react-resizable-panels:playground:panels:main", "{corrupt");
    await render();
    expect(container.querySelector("iframe")).not.toBeNull();
  });

  it("runs the example once more, with a clean console, when the layout switches to mobile", async () => {
    await render();
    const frame = container.querySelector("iframe") as HTMLIFrameElement;
    const source = frame.contentWindow;
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { data: { type: "ready" }, source }));
      window.dispatchEvent(
        new MessageEvent("message", { data: { type: "console", runId: 1, level: "log", text: "hello" }, source })
      );
    });
    expect(log()).toContain("hello");
    setWidth(500);
    expect(log()).not.toContain("hello");
  });

  it("saves the last edit when the page unloads", async () => {
    await render();
    const content = container.querySelector(".cm-content") as HTMLElement;
    act(() => EditorView.findFromDOM(content)?.dispatch({ changes: { from: 0, insert: "edited " } }));
    expect(localStorage.getItem("playground:pixi-8:first")).toBeNull();
    window.dispatchEvent(new PageTransitionEvent("pagehide"));
    expect(JSON.parse(localStorage.getItem("playground:pixi-8:first") ?? "null")).toMatchObject({
      code: "edited code",
    });
  });

  it("clears the running mark when the page unloads during a run", async () => {
    await render();
    const source = (container.querySelector("iframe") as HTMLIFrameElement).contentWindow;
    act(() => window.dispatchEvent(new MessageEvent("message", { data: { type: "ready" }, source })));
    expect(localStorage.getItem("playground:pixi-8-running")).toBe("first");
    window.dispatchEvent(new PageTransitionEvent("pagehide"));
    expect(localStorage.getItem("playground:pixi-8-running")).toBeNull();
  });

  it("says so when the browser cannot pack the code into a link", async () => {
    vi.stubGlobal(
      "CompressionStream",
      class {
        constructor() {
          throw new TypeError("Unsupported compression format");
        }
      }
    );
    await render();
    const share = [...container.querySelectorAll("button")].find(button => button.textContent === "Share");
    await act(async () => share?.click());
    await vi.waitFor(() => expect(document.body.textContent).toContain("This browser cannot create a share link."));
  });

  it("shows the setup collapsed to its summary until opened", async () => {
    await render();
    expect(container.textContent).toContain("React 19 and PixiJS 8");
    expect(container.textContent).not.toContain("configure();");
    const toggle = [...container.querySelectorAll("button")].find(button =>
      button.textContent?.includes("React 19 and PixiJS 8")
    );
    act(() => toggle?.click());
    expect(container.textContent).toContain("configure();");
  });

  it("copies the setup code", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    await render();
    await act(async () => container.querySelector<HTMLButtonElement>("[aria-label='Copy setup']")?.click());
    expect(writeText).toHaveBeenCalledWith("configure();");
  });
});

describe("withConsoleSize", () => {
  it("gives the console its open size and scales the other panels to fill the rest", () => {
    const layout = withConsoleSize({ console: 3, editor: 37, preview: 60 }, 15);
    expect(layout?.console).toBe(15);
    expect(layout?.editor).toBeCloseTo((37 * 85) / 97);
    expect(layout?.preview).toBeCloseTo((60 * 85) / 97);
  });

  it("gives nothing for a console that fills the group", () => {
    expect(withConsoleSize({ console: 100, preview: 0 }, 30)).toBeUndefined();
  });
});
