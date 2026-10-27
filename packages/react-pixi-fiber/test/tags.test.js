import { describe, it, expect } from "vitest";
import { DEPRECATED_TAGS, DISPLAY_OBJECT_TAGS, FILTER_TAGS, TAGS } from "../src/tags";

describe("TAGS", () => {
  it("names the 13 Display Objects every PixiJS major has, PixiJS 8 spelling", () => {
    expect(Object.keys(DISPLAY_OBJECT_TAGS).sort()).toEqual([
      "AnimatedSprite",
      "BitmapText",
      "Container",
      "Graphics",
      "Mesh",
      "MeshPlane",
      "MeshRope",
      "MeshSimple",
      "NineSliceSprite",
      "ParticleContainer",
      "Sprite",
      "Text",
      "TilingSprite",
    ]);
  });
  it("names the 5 filters every PixiJS major has", () => {
    expect(Object.keys(FILTER_TAGS).sort()).toEqual([
      "AlphaFilter",
      "BlurFilter",
      "ColorMatrixFilter",
      "DisplacementFilter",
      "NoiseFilter",
    ]);
  });
  it("joins both lists, each tag equal to its name", () => {
    expect(Object.keys(TAGS).sort()).toEqual([...Object.keys(DISPLAY_OBJECT_TAGS), ...Object.keys(FILTER_TAGS)].sort());
    for (const [key, value] of Object.entries(TAGS)) expect(value).toBe(key);
  });
  it("maps the 2.x NineSlicePlane tag to NineSliceSprite", () => {
    expect(DEPRECATED_TAGS).toEqual({ NineSlicePlane: "NineSliceSprite" });
  });
});
