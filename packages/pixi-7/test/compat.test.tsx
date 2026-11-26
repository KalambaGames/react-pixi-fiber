import * as PIXI from "pixi.js";
import React from "react";
import renderer, { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PixiAdapter } from "react-pixi-fiber";
import { configure, PIXIComponent, Sprite, Stage } from "react-pixi-fiber";
import react18 from "@react-pixi-fiber/react-18";

import pixi7 from "../src/index";

type Translate = typeof import("../src/compat/pixi6").default;
let compat: Translate;
// The translator warns once per prop name for the whole module, so every test loads a fresh copy.
beforeEach(async () => {
  vi.resetModules();
  compat = (await import("../src/compat/pixi6")).default;
});
afterEach(() => vi.restoreAllMocks());

async function mount(adapter: PixiAdapter, element: React.ReactElement) {
  configure({ react: react18(), pixi: adapter });
  let app: PIXI.Application | null = null;
  const tree = renderer.create(
    <Stage
      options={{ width: 800, height: 600 }}
      onInit={a => {
        app = a as PIXI.Application;
      }}
    >
      {element}
    </Stage>,
    { createNodeMock: () => document.createElement("canvas") }
  );
  await act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });
  return { app: app! as PIXI.Application, tree };
}

describe("pixi7({ compat }) with compat/pixi6", () => {
  it("renames interactive, buttonMode and the legacy event props, warning once per name in development", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const adapter = pixi7({ compat });
    const fn = () => {};
    expect(
      adapter.translateProps!("Sprite", { buttonMode: true, click: fn, interactive: true, pointerdown: fn, x: 1 })
    ).toEqual({ cursor: "pointer", eventMode: "static", onclick: fn, onpointerdown: fn, x: 1 });
    expect(adapter.translateProps!("Sprite", { buttonMode: false, interactive: false })).toEqual({
      cursor: null,
      eventMode: "auto",
    });
    const messages = error.mock.calls.map(c => c[0]).filter(m => /is a PixiJS 6 prop, translated/.test(m));
    expect(messages).toHaveLength(__DEV__ ? 4 : 0);
    if (__DEV__) expect(messages[1]).toMatch(/`click`.*Rename it to `onclick`/);
  });
  it("renames the move events to the global move events", () => {
    const fn = () => {};
    expect(pixi7({ compat }).translateProps!("Sprite", { mousemove: fn, pointermove: fn, touchmove: fn })).toEqual({
      onglobalmousemove: fn,
      onglobalpointermove: fn,
      onglobaltouchmove: fn,
    });
  });
  it("leaves name, added and removed alone", () => {
    const props = { added: () => {}, name: "bunny", removed: () => {} };
    expect(pixi7({ compat }).translateProps!("Sprite", props)).toBe(props);
  });
  it("lets the PixiJS 7 prop win over the translated one, warning once naming both", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const adapter = pixi7({ compat });
    const fn = () => {};
    const other = () => {};
    expect(adapter.translateProps!("Sprite", { eventMode: "dynamic", interactive: true })).toEqual({
      eventMode: "dynamic",
    });
    expect(adapter.translateProps!("Sprite", { click: fn, onclick: other })).toEqual({ onclick: other });
    const both = error.mock.calls.map(c => c[0]).filter(m => /are both set/.test(m));
    expect(both).toHaveLength(__DEV__ ? 2 : 0);
    if (__DEV__) expect(both[1]).toMatch(/`click` and `onclick`.*`onclick` wins/);
  });
  it("throws when compat is not a function", () => {
    expect(() => pixi7({ compat: "pixi6" as unknown as Translate })).toThrow(/"pixi6".*compat\/pixi6/);
  });
  it("runs a pointerdown handler through the PixiJS 7 EventBoundary", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn();
    const { app, tree } = await mount(pixi7({ compat }), <Sprite interactive pointerdown={handler} />);
    const sprite = app.stage.children[0] as PIXI.Sprite;
    const boundary = app.renderer.events.rootBoundary;
    const event = new PIXI.FederatedPointerEvent(boundary);
    event.type = "pointerdown";
    boundary.rootTarget = app.stage;
    event.target = sprite;
    boundary.dispatchEvent(event, "pointerdown");
    expect(handler).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });
  it("runs a pointermove handler for a move outside the sprite, as PixiJS 6 did", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn();
    const { app, tree } = await mount(
      pixi7({ compat }),
      <Sprite interactive pointermove={handler} texture={PIXI.Texture.WHITE} x={400} y={300} />
    );
    const view = app.view as HTMLCanvasElement;
    view.getBoundingClientRect = () =>
      ({ x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }) as DOMRect;
    // The mocked WebGL context does not render, so do what a render does for hit testing.
    (app.renderer as any).objectRenderer.lastObjectRendered = app.stage;
    const parent = app.stage.enableTempParent();
    app.stage.updateTransform();
    app.stage.disableTempParent(parent);
    const move = { bubbles: true, clientY: 10, isPrimary: true, pointerId: 1, pointerType: "mouse" };
    act(() => {
      document.dispatchEvent(new PointerEvent("pointermove", { ...move, clientX: 10 }));
    });
    expect(handler).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });
});

describe("pixi7() without compat", () => {
  it("warns once in development per PixiJS 6 prop that PixiJS 7 ignores, naming the compat module", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn();
    const { app, tree } = await mount(pixi7(), <Sprite buttonMode interactive pointerdown={handler} />);
    const sprite = app.stage.children[0] as PIXI.Sprite;
    // Set as-is, as any untyped prop: PixiJS 7 never calls it.
    expect((sprite as any).pointerdown).toBe(handler);
    expect(sprite.onpointerdown).toBeNull();
    // A second render with the same props does not warn again.
    act(() => {
      tree.update(
        <Stage options={{ width: 800, height: 600 }}>
          <Sprite buttonMode pointerdown={() => {}} />
        </Stage>
      );
    });
    const messages = error.mock.calls.map(c => String(c[0])).filter(m => /PixiJS 7 ignores/.test(m));
    expect(messages).toHaveLength(__DEV__ ? 2 : 0);
    if (__DEV__) {
      expect(messages[0]).toMatch(/`buttonMode` on `<Sprite \/>`.*`@react-pixi-fiber\/pixi-7\/compat\/pixi6`/);
      expect(messages[1]).toMatch(/`pointerdown` on `<Sprite \/>`/);
    }
    act(() => tree.unmount());
  });
  it("mounts a PIXIComponent whose applyProps calls applyDisplayObjectProps", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const Custom = PIXIComponent("LegacyApplyProps", {
      create: () => new PIXI.Container(),
      applyProps(_instance: PIXI.Container, oldProps: any, newProps: any) {
        (this as any).applyDisplayObjectProps(oldProps, newProps);
      },
    });
    const { app, tree } = await mount(pixi7(), <Custom x={5} />);
    expect(app.stage.children[0].x).toBe(5);
    expect(error.mock.calls.filter(c => /Cannot convert undefined or null/.test(String(c[0])))).toHaveLength(0);
    act(() => tree.unmount());
  });
  it("passes a ColorSource tint through to the sprite", async () => {
    const { app, tree } = await mount(pixi7(), <Sprite tint="#ff0000" />);
    const sprite = app.stage.children[0] as PIXI.Sprite;
    expect(sprite.tint).not.toBe(0xffffff);
    expect(new PIXI.Color(sprite.tint).toNumber()).toBe(0xff0000);
    act(() => tree.unmount());
  });
  it("sets no translateProps in production", () => {
    expect(typeof pixi7().translateProps).toBe(__DEV__ ? "function" : "undefined");
  });
});
