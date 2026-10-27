import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import * as PIXI from "pixi.js";
import { act } from "react-test-renderer";
import { TAGS } from "../src/tags";
import { PIXIComponent, applyProps, getInstanceTag, render, unmount } from "../src/index";
import { createInstance } from "../src/ReactPixiFiberComponent";
import { validateProperties } from "../src/ReactPixiFiberUnknownPropertyHook";

// The core against pixi-6, which test/setup.ts configures. packages/pixi-6/test covers the adapter's own data.
const texture = PIXI.Texture.WHITE;
const propsFor = {
  AlphaFilter: {},
  AnimatedSprite: { textures: [texture] },
  BitmapText: { style: { fontName: "test" }, text: "t" },
  BlurFilter: {},
  ColorMatrixFilter: {},
  Container: {},
  DisplacementFilter: { sprite: new PIXI.Sprite() },
  Graphics: {},
  Mesh: { geometry: new PIXI.PlaneGeometry(1, 1, 2, 2), shader: new PIXI.MeshMaterial(texture) },
  MeshPlane: { texture, verticesX: 2, verticesY: 2 },
  MeshRope: { points: [new PIXI.Point(0, 0), new PIXI.Point(1, 1)], texture },
  MeshSimple: { texture },
  NineSliceSprite: { bottomHeight: 1, leftWidth: 1, rightWidth: 1, texture, topHeight: 1 },
  NoiseFilter: {},
  ParticleContainer: {},
  Sprite: { texture },
  Text: { text: "t" },
  TilingSprite: { height: 1, texture, width: 1 },
};

PIXI.BitmapFont.from("test", { fontFamily: "Arial" }, { chars: [["a", "z"]] });

describe("the core with pixi-6", () => {
  afterEach(() => vi.restoreAllMocks());

  it("resolves the adapter's NineSlicePlane alias before the deprecated tag map, without a warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const instance = createInstance("NineSlicePlane", {
      bottomHeight: 1,
      leftWidth: 1,
      rightWidth: 1,
      texture,
      topHeight: 1,
    });
    expect(instance).toBeInstanceOf(PIXI.NineSlicePlane);
    expect(getInstanceTag(instance)).toBe("NineSlicePlane");
    expect(error).not.toHaveBeenCalled();
  });

  it("creates every core tag through createInstance and records its tag", () => {
    for (const tag of Object.keys(TAGS)) {
      const instance = createInstance(tag, propsFor[tag]);
      expect(instance, tag).toBeInstanceOf(tag.endsWith("Filter") ? PIXI.Filter : PIXI.Container);
      expect(getInstanceTag(instance)).toBe(tag);
    }
  });

  it("applyProps works on adapter tag instances", () => {
    const sprite = createInstance("Sprite", { texture });
    applyProps(sprite, {}, { alpha: 0.5, position: "3,4" });
    expect(sprite.alpha).toBe(0.5);
    expect([sprite.x, sprite.y]).toEqual([3, 4]);
  });

  // `validateProperties` is what the reconciler runs under a <StrictMode> ancestor in development; test/strictMode.test.jsx
  // covers the same through the renderer.
  it("does not report plain props on a PIXIComponent tag, but still checks the casing of typed names", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    PIXIComponent("StrictThing", () => new PIXI.Container());
    validateProperties("StrictThing", { anything: 1, textur: texture });
    const messages = error.mock.calls.map(call => String(call[0])).join("\n");
    expect(messages).not.toMatch(/does not recognize/);
    validateProperties("StrictThing", { buttonmode: true });
    if (__DEV__)
      expect(error.mock.calls.at(-1)[0]).toMatch(
        /Invalid prop `buttonmode` on `<StrictThing \/>`. Did you mean `buttonMode`\?/
      );
  });

  it("sets a plain prop on the instance as-is", () => {
    const Thing = PIXIComponent("PlainThing", () => new PIXI.Container());
    const stage = new PIXI.Container();
    act(() => render(React.createElement(Thing, { anything: 1 }), stage));
    expect(stage.children[0].anything).toBe(1);
    act(() => unmount(stage));
  });
});
