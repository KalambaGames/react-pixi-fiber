// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSidebarOpen } from "../src/parent/useSidebarOpen";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let latest: ReturnType<typeof useSidebarOpen>;

function Harness() {
  latest = useSidebarOpen();
  return null;
}

let root: Root;
const render = () => act(() => root.render(<Harness />));

beforeEach(() => {
  localStorage.clear();
  root = createRoot(document.createElement("div"));
});

afterEach(() => {
  act(() => root.unmount());
  vi.restoreAllMocks();
});

describe("useSidebarOpen", () => {
  it("starts open", () => {
    render();
    expect(latest[0]).toBe(true);
  });

  it("keeps a closed sidebar closed after a reload", () => {
    render();
    act(() => latest[1](false));
    act(() => root.unmount());
    root = createRoot(document.createElement("div"));
    render();
    expect(latest[0]).toBe(false);
  });

  it("works where cookies and storage throw", () => {
    vi.spyOn(Document.prototype, "cookie", "get").mockImplementation(() => {
      throw new DOMException("sandboxed", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("sandboxed", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("sandboxed", "SecurityError");
    });
    render();
    act(() => latest[1](false));
    expect(latest[0]).toBe(false);
  });
});
