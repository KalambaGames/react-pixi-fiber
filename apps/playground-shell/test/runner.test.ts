// @vitest-environment jsdom
import * as jsxRuntime from "react/jsx-runtime";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { canRun, compile, createModuleRequire, startRunner } from "../src/runner";

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

describe("startRunner", () => {
  const originalConsole = { ...console };
  afterEach(() => {
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

  it("runs code from the parent only", () => {
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
    expect(render).toHaveBeenCalledTimes(1);

    const bad = { type: "run", runId: 8, code: "import x from 'nope'; export default x;" };
    window.dispatchEvent(new MessageEvent("message", { data: bad, origin: location.origin, source: window.parent }));
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ type: "console", runId: 8, level: "error", text: expect.stringContaining("nope") }),
      "*"
    );

    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    console.log("hi", cycle);
    console.error("a %s b %d %c!", "x", 3, "css", { y: 1 });
    console.warn("100%% %s", "sure");
    console.info("plain", 1, "two");
    console.log("%d", Symbol("x"));
    expect(post).toHaveBeenCalledWith(
      { type: "console", runId: 8, level: "log", text: 'hi {"self":"[Circular]"}' },
      "*"
    );
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ level: "error", text: 'a x b 3 ! {"y":1}' }), "*");
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ level: "warn", text: "100% sure" }), "*");
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ level: "info", text: "plain 1 two" }), "*");
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ level: "log", text: "NaN" }), "*");
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
    const errors = post.mock.calls.filter(([message]) => (message as { runId?: number }).runId === 9);
    expect(errors).toEqual([[expect.objectContaining({ level: "error", text: expect.stringContaining("boom") }), "*"]]);
    const next = { type: "run", runId: 10, code: "export default () => { console.log('again'); return null; };" };
    await act(async () =>
      window.dispatchEvent(new MessageEvent("message", { data: next, origin: location.origin, source: window.parent }))
    );
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ runId: 10, text: "again" }), "*");
    act(() => root.unmount());
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
