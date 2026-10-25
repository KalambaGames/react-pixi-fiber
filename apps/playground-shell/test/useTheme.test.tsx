// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "../src/parent/useTheme";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let latest: ReturnType<typeof useTheme>;
let systemDark = false;

function Harness() {
  latest = useTheme();
  return null;
}

let container: HTMLDivElement;
let root: Root;
const hasDarkClass = () => document.documentElement.classList.contains("dark");

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ addEventListener: () => {}, matches: systemDark, removeEventListener: () => {} }))
  );
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
  systemDark = false;
});

describe("useTheme", () => {
  it("dark adds the dark class", () => {
    act(() => root.render(<Harness />));
    act(() => latest.setTheme("dark"));
    expect(hasDarkClass()).toBe(true);
    expect(latest.dark).toBe(true);
  });

  it("light removes the dark class", () => {
    act(() => root.render(<Harness />));
    act(() => latest.setTheme("dark"));
    act(() => latest.setTheme("light"));
    expect(hasDarkClass()).toBe(false);
    expect(latest.dark).toBe(false);
  });

  it("system follows the media query", () => {
    systemDark = true;
    act(() => root.render(<Harness />));
    expect(hasDarkClass()).toBe(true);
    act(() => root.unmount());
    systemDark = false;
    root = createRoot(container);
    act(() => root.render(<Harness />));
    expect(hasDarkClass()).toBe(false);
  });

  it("choice persists", () => {
    act(() => root.render(<Harness />));
    act(() => latest.setTheme("light"));
    expect(localStorage.getItem("playground:theme")).toBe("light");
    act(() => latest.setTheme("system"));
    expect(localStorage.getItem("playground:theme")).toBeNull();
  });
});
