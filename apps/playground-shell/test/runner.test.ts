// @vitest-environment jsdom
import * as jsxRuntime from "react/jsx-runtime";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canRun, compile, createModuleRequire, loadImports, startRunner } from "../src/runner";

function evaluate(source: string, modules: Record<string, unknown>) {
  const result = compile(source);
  if (!result.ok) throw new Error(result.message);
  const exports: { default?: unknown } = {};
  new Function("require", "exports", result.code)(createModuleRequire(modules), exports);
  return exports.default;
}

describe("compile", () => {
  it("reports syntax errors with a position", () => {
    const result = compile("const a = <b>");
    expect(result).toMatchObject({ ok: false, line: 1 });
  });

  it("accepts TSX with type annotations", () => {
    expect(compile("const a: number = 1; export default () => <div id={String(a)} />;").ok).toBe(true);
  });
});

describe("createModuleRequire", () => {
  const modules = {
    "./assets/bunnys.png": "/assets/bunnys-123.png",
    animated: { default: "A", other: 1 },
    react: React,
    "react/jsx-runtime": jsxRuntime,
  };

  it("resolves default imports, assets and named imports", () => {
    expect(evaluate('import x from "animated"; export default x;', modules)).toBe("A");
    expect(evaluate('import b from "./assets/bunnys.png"; export default b;', modules)).toBe("/assets/bunnys-123.png");
    expect(evaluate('import { useState } from "react"; export default useState;', modules)).toBe(React.useState);
  });

  it("evaluates JSX through the automatic runtime", () => {
    const Component = evaluate('export default () => <div id="x" />;', modules) as () => React.ReactElement;
    expect(Component().type).toBe("div");
  });

  it("names the unknown id and lists the available ones", () => {
    expect(() => createModuleRequire(modules)("nope")).toThrow(/"nope".*animated.*react/);
  });
});

describe("loadImports", () => {
  it("loads a lazy module the code imports before it runs", async () => {
    const loader = vi.fn(async () => ({ default: "G" }));
    const other = vi.fn(async () => ({}));
    const result = compile('import g from "gsap"; export default g;');
    if (!result.ok) throw new Error(result.message);
    const loaded = await loadImports(result.code, { react: React }, { gsap: loader, other });
    expect(loaded).toEqual({ gsap: { default: "G" }, react: React });
    expect(loader).toHaveBeenCalledOnce();
    expect(other).not.toHaveBeenCalled();
  });

  it("leaves unknown names to the require error", async () => {
    expect(await loadImports("require('nope'); require(\"react\");", { react: React }, {})).toEqual({ react: React });
  });

  it("gives up on a lazy module that does not load in 30 seconds", async () => {
    vi.useFakeTimers();
    try {
      const loading = loadImports("require('gsap');", {}, { gsap: () => new Promise(() => {}) });
      const failed = expect(loading).rejects.toThrow('Cannot load "gsap".');
      await vi.advanceTimersByTimeAsync(30_000);
      await failed;
      await expect(loading.catch(error => error.cause.message)).resolves.toBe("It did not load in 30 seconds.");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("startRunner", () => {
  const originalConsole = { ...console };
  // Each runner listens on the window, so a runner from an earlier test would also take the later runs.
  const listeners: Parameters<typeof window.addEventListener>[] = [];
  beforeEach(() => {
    const add = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation((...args: Parameters<typeof window.addEventListener>) => {
      listeners.push(args);
      add(...args);
    });
  });
  afterEach(() => {
    for (const args of listeners.splice(0)) window.removeEventListener(...args);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Object.assign(console, originalConsole);
  });

  it("does nothing outside an opaque origin", () => {
    const post = vi.spyOn(window.parent, "postMessage");
    const render = vi.fn();
    expect(canRun()).toBe(false);
    startRunner({ modules: {}, render });
    expect(post).not.toHaveBeenCalled();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "run", runId: 1, code: "export default () => null;" },
        origin: location.origin,
        source: window.parent,
      })
    );
    expect(render).not.toHaveBeenCalled();
  });

  it("runs code from the parent only", async () => {
    vi.stubGlobal("origin", "null");
    const post = vi.spyOn(window.parent, "postMessage").mockImplementation(() => {});
    const render = vi.fn();
    startRunner({ modules: { "react/jsx-runtime": jsxRuntime }, render });
    expect(post).toHaveBeenCalledWith({ type: "ready" }, "*");

    const data = { type: "run", runId: 7, code: "export default () => <div />;" };
    const stranger = document.body.appendChild(document.createElement("iframe")).contentWindow;
    window.dispatchEvent(new MessageEvent("message", { data, origin: location.origin, source: stranger }));
    window.dispatchEvent(new MessageEvent("message", { data, origin: "https://evil.example", source: window.parent }));
    expect(render).not.toHaveBeenCalled();

    window.dispatchEvent(new MessageEvent("message", { data, origin: location.origin, source: window.parent }));
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith({ type: "started", runId: 7 }, "*");

    const bad = { type: "run", runId: 8, code: "import x from 'nope'; export default x;" };
    window.dispatchEvent(new MessageEvent("message", { data: bad, origin: location.origin, source: window.parent }));
    await vi.waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        expect.objectContaining({ type: "console", runId: 8, level: "error", text: expect.stringContaining("nope") }),
        "*"
      )
    );
    expect(post).toHaveBeenCalledWith({ type: "started", runId: 8 }, "*");

    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    console.log("hi", cycle);
    console.error("a %s b %d %c!", "x", 3, "css", { y: 1 });
    console.warn("100%% %s", "sure");
    console.info("plain", 1, "two");
    console.log("%d", Symbol("x"));
    const looped = new Error("looped");
    looped.cause = looped;
    console.error(looped);
    expect(post).toHaveBeenCalledWith(
      { type: "console", runId: 8, level: "log", text: 'hi {"self":"[Circular]"}' },
      "*"
    );
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ level: "error", text: 'a x b 3 ! {"y":1}' }), "*");
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ level: "warn", text: "100% sure" }), "*");
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ level: "info", text: "plain 1 two" }), "*");
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ level: "log", text: "NaN" }), "*");
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ level: "error", text: expect.stringMatching(/Caused by: \[Circular\]$/) }),
      "*"
    );
  });

  it("reports a render error once", async () => {
    vi.stubGlobal("origin", "null");
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const post = vi.spyOn(window.parent, "postMessage").mockImplementation(() => {});
    const root = createRoot(document.createElement("div"));
    startRunner({
      modules: { "react/jsx-runtime": jsxRuntime },
      render: Component => act(() => root.render(React.createElement(Component))),
    });
    const data = { type: "run", runId: 9, code: "export default () => { throw new Error('boom'); };" };
    await act(async () =>
      window.dispatchEvent(new MessageEvent("message", { data, origin: location.origin, source: window.parent }))
    );
    const errors = post.mock.calls.filter(([message]) => {
      const { level, runId } = message as { level?: string; runId?: number };
      return runId === 9 && level === "error";
    });
    expect(errors).toEqual([[expect.objectContaining({ level: "error", text: expect.stringContaining("boom") }), "*"]]);
    const next = { type: "run", runId: 10, code: "export default () => { console.log('again'); return null; };" };
    await act(async () =>
      window.dispatchEvent(new MessageEvent("message", { data: next, origin: location.origin, source: window.parent }))
    );
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ runId: 10, text: "again" }), "*");
    act(() => root.unmount());
  });

  const run = (runId: number, code: string) =>
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "run", runId, code },
        origin: location.origin,
        source: window.parent,
      })
    );

  it("runs code that names a lazy module only in a string", async () => {
    vi.stubGlobal("origin", "null");
    const post = vi.spyOn(window.parent, "postMessage").mockImplementation(() => {});
    const render = vi.fn();
    startRunner({ lazyModules: { gsap: async () => ({}) }, modules: {}, render });
    run(11, "export default () => \"require('gsap')\";");
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith({ type: "started", runId: 11 }, "*"));
    expect(render).toHaveBeenCalledOnce();
    expect(post).not.toHaveBeenCalledWith(expect.objectContaining({ level: "error" }), "*");
  });

  it("reports a failed lazy load and posts started", async () => {
    vi.stubGlobal("origin", "null");
    const post = vi.spyOn(window.parent, "postMessage").mockImplementation(() => {});
    const render = vi.fn();
    startRunner({ lazyModules: { gsap: () => Promise.reject(new Error("offline")) }, modules: {}, render });
    run(12, 'import g from "gsap"; export default g;');
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith({ type: "started", runId: 12 }, "*"));
    const errors = post.mock.calls.filter(([message]) => (message as { level?: string }).level === "error");
    expect(errors).toEqual([
      [expect.objectContaining({ runId: 12, text: expect.stringMatching(/gsap[\s\S]*offline/) }), "*"],
    ]);
    expect(render).not.toHaveBeenCalled();
  });

  it("posts started after a compile error", async () => {
    vi.stubGlobal("origin", "null");
    const post = vi.spyOn(window.parent, "postMessage").mockImplementation(() => {});
    startRunner({ modules: {}, render: vi.fn() });
    run(13, "const a = <b>");
    await vi.waitFor(() => expect(post).toHaveBeenCalledWith({ type: "started", runId: 13 }, "*"));
  });

  it("logs objects to a limited depth", () => {
    vi.stubGlobal("origin", "null");
    const post = vi.spyOn(window.parent, "postMessage").mockImplementation(() => {});
    startRunner({ modules: {}, render: vi.fn() });
    class Texture {
      width = 1;
    }
    class Sprite {
      texture = new Texture();
      x = 2;
    }
    const shared = { n: 1 };
    console.log({ a: { b: { c: { d: 1 } } }, list: [[[[1]]]] });
    console.log(new Sprite());
    console.log({ first: shared, second: shared });
    const texts = post.mock.calls.map(([message]) => (message as { text?: string }).text);
    expect(texts).toContain('{"a":{"b":{"c":"[Object]"}},"list":[["[Array]"]]}');
    expect(texts).toContain('{"texture":"[Texture]","x":2}');
    expect(texts).toContain('{"first":{"n":1},"second":{"n":1}}');
  });
});
