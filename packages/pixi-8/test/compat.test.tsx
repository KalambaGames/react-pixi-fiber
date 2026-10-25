import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React from "react";
import renderer, { act } from "react-test-renderer";
import * as PIXI from "pixi.js";
import react18 from "@react-pixi-fiber/react-18";
import { configure, Sprite, Stage } from "react-pixi-fiber";
import pixi8 from "../src/index";

type Translate = typeof import("../src/compat/pixi6").default;
let compat: Translate;
// The translator warns once per prop name for the whole module, so every test loads a fresh copy.
beforeEach(async () => {
  vi.resetModules();
  compat = (await import("../src/compat/pixi6")).default;
});

describe("pixi8({ compat }) with compat/pixi6", () => {
  afterEach(() => vi.restoreAllMocks());
  it("renames interactive, buttonMode and the legacy event props, warning once per name in development", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const adapter = pixi8({ compat });
    const fn = () => {};
    const out = adapter.translateProps!("Sprite", {
      buttonMode: true,
      click: fn,
      interactive: true,
      pointerdown: fn,
      x: 1,
    });
    expect(out).toEqual({ cursor: "pointer", eventMode: "static", onclick: fn, onpointerdown: fn, x: 1 });
    adapter.translateProps!("Sprite", { buttonMode: false, interactive: false });
    expect(adapter.translateProps!("Sprite", { interactive: false })).toEqual({ eventMode: "passive" });
    expect(error.mock.calls.filter(c => /is a PixiJS 6 and 7 prop/.test(c[0]))).toHaveLength(__DEV__ ? 4 : 0);
  });
  it("names the replacement prop in the warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    pixi8({ compat }).translateProps!("Sprite", { click: 1, interactive: true });
    const messages = error.mock.calls.map(c => c[0]);
    expect(messages.filter(m => /`click`.*Rename it to `onclick`/.test(m))).toHaveLength(__DEV__ ? 1 : 0);
    expect(messages.filter(m => /`interactive`.*Rename it to `eventMode`/.test(m))).toHaveLength(__DEV__ ? 1 : 0);
  });
  it("renames the move events to the global move events, which fire whether or not the pointer is over the object", () => {
    const fn = () => {};
    expect(pixi8({ compat }).translateProps!("Sprite", { mousemove: fn, pointermove: fn, touchmove: fn })).toEqual({
      onglobalmousemove: fn,
      onglobalpointermove: fn,
      onglobaltouchmove: fn,
    });
  });
  it("renames uvRespectAnchor to applyAnchorToTexture", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(pixi8({ compat }).translateProps!("TilingSprite", { uvRespectAnchor: true })).toEqual({
      applyAnchorToTexture: true,
    });
  });
  it("renames name to label, which PixiJS 8 renamed on Container", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(pixi8({ compat }).translateProps!("Sprite", { name: "bunny" })).toEqual({ label: "bunny" });
    expect(error.mock.calls.filter(c => /`name`.*Rename it to `label`/.test(c[0]))).toHaveLength(__DEV__ ? 1 : 0);
  });
  it("lets the PixiJS 8 prop win over the translated one, warning once naming both", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const adapter = pixi8({ compat });
    const fn = () => {};
    const other = () => {};
    expect(adapter.translateProps!("Sprite", { eventMode: "dynamic", interactive: true })).toEqual({
      eventMode: "dynamic",
    });
    expect(adapter.translateProps!("Sprite", { interactive: true, eventMode: "dynamic" })).toEqual({
      eventMode: "dynamic",
    });
    expect(adapter.translateProps!("Sprite", { click: fn, onclick: other })).toEqual({ onclick: other });
    const both = error.mock.calls.map(c => c[0]).filter(m => /are both set/.test(m));
    expect(both).toHaveLength(__DEV__ ? 2 : 0);
    if (__DEV__) {
      expect(both[0]).toMatch(/`interactive` and `eventMode`.*`eventMode` wins/);
      expect(both[1]).toMatch(/`click` and `onclick`.*`onclick` wins/);
    }
  });
  it("returns the same props object when nothing is renamed", () => {
    const props = { foo: 1 };
    expect(pixi8({ compat }).translateProps!("Sprite", props)).toBe(props);
  });
});

it("serves compat/pixi7 from the same module as compat/pixi6", async () => {
  const pkg = (await import("../package.json")).exports as Record<string, unknown>;
  expect(pkg["./compat/pixi7"]).toEqual(pkg["./compat/pixi6"]);
});

it("throws when compat is not a function, naming the compat subpaths", () => {
  expect(() => pixi8({ compat: "pixi6" as unknown as Translate })).toThrow(/"pixi6".*compat\/pixi6.*compat\/pixi7/);
});

describe("2.x props on pixi8({ compat })", () => {
  afterEach(() => vi.restoreAllMocks());
  it("renders the 2.x interaction props on Stage and Sprite", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    configure({ react: react18(), pixi: pixi8({ compat }) });
    const click = () => {};
    const pointerdown = () => {};
    let app: PIXI.Application | null = null;
    const tree = renderer.create(
      <Stage
        buttonMode
        click={click}
        interactive
        onInit={a => {
          app = a as PIXI.Application;
        }}
        options={{ height: 8, width: 8 }}
      >
        <Sprite buttonMode interactive name="bunny" pointerdown={pointerdown} />
      </Stage>,
      { createNodeMock: () => document.createElement("canvas") }
    );
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    const stage = app!.stage;
    expect(stage).toMatchObject({ cursor: "pointer", eventMode: "static", onclick: click });
    expect(stage.children[0]).toMatchObject({
      cursor: "pointer",
      eventMode: "static",
      label: "bunny",
      onpointerdown: pointerdown,
    });
    act(() => tree.unmount());
    const translated = error.mock.calls.filter(c => /is a PixiJS 6 and 7 prop/.test(String(c[0])));
    // One warning per name: buttonMode, click, interactive, name, pointerdown.
    expect(translated).toHaveLength(__DEV__ ? 5 : 0);
  });
});

describe("pixi8() without compat", () => {
  afterEach(() => vi.restoreAllMocks());
  it("warns once in development per PixiJS 6 prop that PixiJS 8 ignores, naming the compat modules", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const adapter = pixi8();
    const props = { buttonMode: true, click: () => {}, interactive: true, x: 1 };
    expect(adapter.translateProps?.("Sprite", props) ?? props).toBe(props);
    adapter.translateProps?.("Sprite", { buttonMode: false, click: () => {} });
    const messages = error.mock.calls.map(c => String(c[0])).filter(m => /PixiJS 8 ignores/.test(m));
    expect(messages).toHaveLength(__DEV__ ? 2 : 0);
    if (__DEV__) {
      expect(messages[0]).toMatch(
        /`buttonMode` on `<Sprite \/>`.*`@react-pixi-fiber\/pixi-8\/compat\/pixi6`.*`@react-pixi-fiber\/pixi-8\/compat\/pixi7`/
      );
      expect(messages[1]).toMatch(/`click` on `<Sprite \/>`/);
    }
  });
});
