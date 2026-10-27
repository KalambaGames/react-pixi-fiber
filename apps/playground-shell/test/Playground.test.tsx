// @vitest-environment jsdom
import { EditorView } from "codemirror";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Example, Playground, withConsoleSize } from "../src/parent/Playground";
import { createStore } from "../src/storage";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// CodeMirror measures text ranges, which jsdom does not lay out.
Range.prototype.getClientRects = () => ({ item: () => null, length: 0, [Symbol.iterator]: [][Symbol.iterator] });

const example = (id: string, title: string): Example => ({
  configure: { code: "configure();", summary: "React 19 and PixiJS 8" },
  group: "Scene Objects",
  id,
  load: async () => "code",
  runner: "runner.html",
  title,
});
let examples: Example[];

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
  examples = [example("first", "First")];
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

  it("keeps the example running, with its console, when the layout switches to mobile", async () => {
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
    expect(container.querySelector("iframe")).toBe(frame);
    expect(log()).toContain("hello");
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

  it("runs held code when Run is pressed", async () => {
    createStore(8, localStorage).save("first", "edited code", "code");
    localStorage.setItem("playground:pixi-8-running", "first");
    await render();
    const frame = container.querySelector("iframe");
    expect(container.textContent).toContain("The last run of this code did not finish.");
    const run = [...container.querySelectorAll("button")].find(button => button.textContent === "Run");
    act(() => run?.click());
    expect(container.querySelector("iframe")).not.toBe(frame);
    expect(container.textContent).not.toContain("The last run of this code did not finish.");
    expect(container.textContent).toContain("edited code");
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

  it("keeps the editor and the setup state when the layout switches to mobile", async () => {
    await render();
    const editor = container.querySelector(".cm-editor");
    const setup = [...container.querySelectorAll("button")].find(button => button.textContent?.startsWith("Setup:"));
    act(() => setup?.click());
    setWidth(500);
    expect(container.querySelector(".cm-editor")).toBe(editor);
    expect(container.textContent).toContain("configure();");
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

  it("shows a skeleton until the example source loads", async () => {
    let finish!: (code: string) => void;
    examples[0].load = () =>
      new Promise(resolve => {
        finish = resolve;
      });
    await render();
    expect(container.querySelector("[data-slot=skeleton]")).not.toBeNull();
    expect(container.querySelector(".cm-editor")).toBeNull();
    await act(async () => finish("code"));
    expect(container.querySelector(".cm-editor")).not.toBeNull();
  });

  it("tells the reader when the example source cannot load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    examples[0].load = () => Promise.reject(new TypeError("Failed to fetch dynamically imported module"));
    await render();
    expect(container.textContent).toContain("This example could not load.");
    expect(container.querySelector("[data-slot=skeleton]")).toBeNull();
    const reload = [...container.querySelectorAll("button")].find(button => button.textContent === "Reload");
    expect(reload).toBeDefined();
  });

  it("opens the last selected example when the hash changes during a load", async () => {
    let finishFirst!: (code: string) => void;
    examples = [example("first", "First"), example("second", "Second")];
    examples[0].load = () =>
      new Promise(resolve => {
        finishFirst = resolve;
      });
    examples[1].load = async () => "second code";
    await render();
    window.history.replaceState(null, "", "#second");
    await act(async () => window.dispatchEvent(new HashChangeEvent("hashchange")));
    await act(async () => finishFirst("first code"));
    const content = container.querySelector(".cm-content") as HTMLElement;
    expect(EditorView.findFromDOM(content)?.state.doc.toString()).toBe("second code");
  });

  it("copies the setup code", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    await render();
    const setup = [...container.querySelectorAll("button")].find(button => button.textContent?.startsWith("Setup:"));
    await act(async () => setup?.click());
    await act(async () => container.querySelector<HTMLButtonElement>("[aria-label='Copy setup']")?.click());
    expect(writeText).toHaveBeenCalledWith("configure();");
  });
});

describe("Playground sidebar", () => {
  const titles = () =>
    [...container.querySelectorAll<HTMLAnchorElement>("[data-sidebar=content] a")].map(link => link.textContent);
  const groupLabel = (name: string) =>
    [...container.querySelectorAll<HTMLElement>("[data-sidebar=menu-button]")].find(
      button => button.textContent === name
    );
  const filter = (text: string) =>
    act(() => {
      const input = container.querySelector<HTMLInputElement>("[data-sidebar=input]") as HTMLInputElement;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

  beforeEach(() => {
    examples = [
      example("first", "First"),
      example("sprite", "Sprite"),
      { ...example("bunnymark", "Bunnymark"), group: "Features" },
      { ...example("sprite-props", "Sprite props"), group: "Features" },
      { ...example("tilemap", "Tilemap"), group: "Integrations" },
    ];
  });

  it("opens only the group of the current example", async () => {
    await render();
    expect(titles()).toEqual(["First", "Sprite"]);
  });

  it("shows that a group label is clickable", async () => {
    await render();
    expect(groupLabel("Features")?.className).toContain("cursor-pointer");
  });

  it("lists the Filters group between Features and Integrations", async () => {
    examples.push({ ...example("filters-basic", "Basic"), group: "Filters" });
    await render();
    const labels = [...container.querySelectorAll<HTMLElement>("[data-sidebar=menu-button]")].map(
      button => button.textContent
    );
    expect(labels.filter(label => ["Features", "Filters", "Integrations"].includes(label ?? ""))).toEqual([
      "Features",
      "Filters",
      "Integrations",
    ]);
  });

  it("marks the current example with the primary color", async () => {
    await render();
    const current = container.querySelector<HTMLElement>("[data-sidebar=menu-sub-button][data-active=true]");
    expect(current?.textContent).toBe("First");
    expect(current?.className).toContain("data-[active=true]:bg-sidebar-primary");
  });

  it("opens a group when its label is clicked", async () => {
    await render();
    act(() => groupLabel("Features")?.click());
    expect(titles()).toEqual(["First", "Sprite", "Bunnymark", "Sprite props"]);
  });

  it("opens the group of the example that the hash moves to", async () => {
    await render();
    window.history.replaceState(null, "", "#tilemap");
    await act(async () => window.dispatchEvent(new HashChangeEvent("hashchange")));
    expect(titles()).toContain("Tilemap");
  });

  it("filters the examples by title, ignoring case, and hides the groups without matches", async () => {
    await render();
    filter("SPRITE");
    expect(titles()).toEqual(["Sprite", "Sprite props"]);
    expect(groupLabel("Integrations")).toBeUndefined();
  });

  it("says so when no example matches the filter", async () => {
    await render();
    filter("zzz");
    expect(titles()).toEqual([]);
    expect(container.querySelector("[data-sidebar=content]")?.textContent).toContain("No examples match");
  });

  it("marks the examples that have a saved edit", async () => {
    createStore(8, localStorage).save("sprite", "edited code", "code");
    await render();
    expect(container.querySelector('a[href="#sprite"] [aria-label=Edited]')).not.toBeNull();
    expect(container.querySelector('a[href="#first"] [aria-label=Edited]')).toBeNull();
  });

  it("marks the current example as edited in the sidebar and the breadcrumb once the edit is saved", async () => {
    await render();
    const content = container.querySelector(".cm-content") as HTMLElement;
    act(() => EditorView.findFromDOM(content)?.dispatch({ changes: { from: 0, insert: "edited " } }));
    act(() => window.dispatchEvent(new PageTransitionEvent("pagehide")));
    expect(container.querySelector('a[href="#first"] [aria-label=Edited]')).not.toBeNull();
    expect(container.querySelector("[data-slot=breadcrumb]")?.textContent).toContain("Edited");
  });

  it("removes the edited marks when the example is reset", async () => {
    createStore(8, localStorage).save("first", "edited code", "code");
    await render();
    const reset = [...container.querySelectorAll("button")].find(button => button.textContent === "Reset");
    await act(async () => reset?.click());
    expect(container.querySelector('a[href="#first"] [aria-label=Edited]')).toBeNull();
    expect(container.querySelector("[data-slot=breadcrumb]")?.textContent).not.toContain("Edited");
  });

  it("closes the other groups again when the filter is cleared", async () => {
    await render();
    filter("sprite");
    filter("");
    expect(titles()).toEqual(["First", "Sprite"]);
  });

  it("keeps the group of the current example open after a label click while filtering", async () => {
    await render();
    filter("sprite");
    act(() => groupLabel("Scene Objects")?.click());
    filter("");
    expect(titles()).toEqual(["First", "Sprite"]);
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
