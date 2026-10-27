import * as PIXI from "pixi.js";
import { describe, expect, it } from "vitest";
import { allClasses } from "../src/all";

const KEYS = [
  "AlphaFilter",
  "AnimatedSprite",
  "Application",
  "BitmapText",
  "BlurFilter",
  "ColorMatrixFilter",
  "Container",
  "DOMContainer",
  "DisplacementFilter",
  "Graphics",
  "HTMLText",
  "Mesh",
  "MeshPlane",
  "MeshRope",
  "MeshSimple",
  "NineSliceSprite",
  "NoiseFilter",
  "Particle",
  "ParticleContainer",
  "PerspectiveMesh",
  "RenderContainer",
  "RenderLayer",
  "Sprite",
  "Text",
  "TilingSprite",
];

// The display classes of pixi.js that are no tag: base classes, internal classes, the deprecated name that the core
// maps to `NineSliceSprite`, and classes that no tag creates yet.
const NOT_TAGS = [
  "AbstractSplitText",
  "AbstractText",
  "BitmapTextGraphics",
  "NineSlicePlane",
  "SplitBitmapText",
  "SplitText",
  "ViewContainer",
];
// The filter classes of pixi.js that are no tag: base classes and the internal passes of other filters. The subclasses
// of `BlendModeFilter` implement the advanced `blendMode` values and are no tag either.
const NOT_FILTER_TAGS = ["BlendModeFilter", "BlurFilterPass", "Filter", "MaskFilter", "PassthroughFilter"];

describe("allClasses", () => {
  it("lists the 24 tags and Application, alphabetical", () => {
    expect(Object.keys(allClasses)).toEqual(KEYS);
  });

  it("maps every key to the pixi.js class of that name", () => {
    for (const key of KEYS) {
      expect(allClasses[key as keyof typeof allClasses], key).toBe(PIXI[key as keyof typeof PIXI]);
    }
  });

  it("lists every display and filter class of pixi.js that is no entry of NOT_TAGS or NOT_FILTER_TAGS", () => {
    const display = Object.entries(PIXI)
      .filter(
        ([, value]) =>
          typeof value === "function" &&
          (value === PIXI.Container ||
            value === PIXI.Particle ||
            value.prototype instanceof PIXI.Container ||
            value.prototype instanceof PIXI.Particle)
      )
      .map(([key]) => key)
      .filter(key => !NOT_TAGS.includes(key));
    const filters = Object.entries(PIXI)
      .filter(
        ([, value]) =>
          typeof value === "function" &&
          (value === PIXI.Filter || value.prototype instanceof PIXI.Filter) &&
          !(value.prototype instanceof PIXI.BlendModeFilter)
      )
      .map(([key]) => key)
      .filter(key => !NOT_FILTER_TAGS.includes(key));
    expect([...display, ...filters].sort()).toEqual(KEYS.filter(key => key !== "Application"));
  });
});
