import { describe, it, expect, vi } from "vitest";
import * as PIXI from "pixi.js";
import { DISPLAY_OBJECT_TAGS, FILTER_TAGS, TAGS } from "../../react-pixi-fiber/src/tags";
import pixi6, { FXAAFilter, NineSlicePlane, SimpleMesh, SimplePlane, SimpleRope } from "../src/index";

const texture = PIXI.Texture.WHITE;
const propsFor: Record<string, Record<string, unknown>> = {
  AlphaFilter: {},
  AnimatedSprite: { textures: [texture] },
  BitmapText: { style: { fontName: "test" }, text: "t" },
  BlurFilter: {},
  ColorMatrixFilter: {},
  Container: {},
  DisplacementFilter: { sprite: new PIXI.Sprite(texture) },
  FXAAFilter: {},
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
const classFor: Record<string, new (...args: any[]) => unknown> = {
  AlphaFilter: PIXI.filters.AlphaFilter,
  AnimatedSprite: PIXI.AnimatedSprite,
  BitmapText: PIXI.BitmapText,
  BlurFilter: PIXI.filters.BlurFilter,
  ColorMatrixFilter: PIXI.filters.ColorMatrixFilter,
  Container: PIXI.Container,
  DisplacementFilter: PIXI.filters.DisplacementFilter,
  FXAAFilter: PIXI.filters.FXAAFilter,
  Graphics: PIXI.Graphics,
  Mesh: PIXI.Mesh,
  MeshPlane: PIXI.SimplePlane,
  MeshRope: PIXI.SimpleRope,
  MeshSimple: PIXI.SimpleMesh,
  NineSliceSprite: PIXI.NineSlicePlane,
  NoiseFilter: PIXI.filters.NoiseFilter,
  ParticleContainer: PIXI.ParticleContainer,
  Sprite: PIXI.Sprite,
  Text: PIXI.Text,
  TilingSprite: PIXI.TilingSprite,
};

PIXI.BitmapFont.from("test", { fontFamily: "Arial" }, { chars: [["a", "z"]] });

describe("pixi6", () => {
  const adapter = pixi6();
  it("implements the 18 core tags, FXAAFilter and the four PixiJS 6 class-name aliases", () => {
    for (const tag of Object.keys(TAGS)) expect(typeof adapter.components[tag].create, tag).toBe("function");
    const aliases = { NineSlicePlane, SimpleMesh, SimplePlane, SimpleRope } as Record<string, unknown>;
    for (const [name, value] of Object.entries(aliases)) expect(value).toBe(name);
    expect(adapter.components.NineSlicePlane).toBe(adapter.components.NineSliceSprite);
    expect(adapter.components.SimpleMesh).toBe(adapter.components.MeshSimple);
    expect(adapter.components.SimplePlane).toBe(adapter.components.MeshPlane);
    expect(adapter.components.SimpleRope).toBe(adapter.components.MeshRope);
    expect(Object.keys(adapter.components).sort()).toEqual(
      [...Object.keys(TAGS), "FXAAFilter", ...Object.keys(aliases)].sort()
    );
  });
  it("marks the filter tags, and no Display Object tag, with kind filter", () => {
    for (const tag of [...Object.keys(FILTER_TAGS), "FXAAFilter"])
      expect(adapter.components[tag].kind, tag).toBe("filter");
    for (const tag of Object.keys(DISPLAY_OBJECT_TAGS)) expect(adapter.components[tag].kind, tag).toBeUndefined();
  });
  it("creates every core tag with the PixiJS 6 class", () => {
    for (const tag of Object.keys(TAGS)) {
      expect(adapter.components[tag].create(propsFor[tag]), tag).toBeInstanceOf(classFor[tag]);
    }
  });
  it("adds the FXAAFilter tag", () => {
    expect(FXAAFilter).toBe("FXAAFilter");
    expect(adapter.components.FXAAFilter.create({})).toBeInstanceOf(PIXI.filters.FXAAFilter);
  });
  it("passes the constructor arguments in order", () => {
    const create = (tag: string, props: Record<string, unknown>) => adapter.components[tag].create(props) as any;
    const blur = create("BlurFilter", { blur: 3, kernelSize: 7, quality: 4, resolution: 2 });
    expect(blur).toBeInstanceOf(PIXI.filters.BlurFilter);
    expect([blur.blur, blur.quality, blur.resolution]).toEqual([3, 4, 2]);
    // PixiJS keeps no kernelSize property: the size is the length of the coordinate array in the shader.
    expect(blur.blurXFilter.program.vertexSrc).toContain("vBlurTexCoords[7];");
    const noise = create("NoiseFilter", { noise: 0.25, seed: 42 });
    expect([noise.noise, noise.seed]).toEqual([0.25, 42]);
    const sprite = new PIXI.Sprite(texture);
    const displacement = create("DisplacementFilter", { scale: 7, sprite });
    expect(displacement.scale.x).toBe(7);
    expect(displacement.maskSprite).toBe(sprite);
    expect(create("AlphaFilter", { alpha: 0.5 }).alpha).toBe(0.5);
  });
  it("creates a BitmapText from a fontName prop without a style, the props winning over the style", () => {
    const text = adapter.components.BitmapText.create({ fontName: "test", text: "t" }) as PIXI.BitmapText;
    expect(text.fontName).toBe("test");
    const sized = adapter.components.BitmapText.create({
      fontSize: 20,
      style: { fontName: "test", fontSize: 10 },
      text: "t",
    });
    expect((sized as PIXI.BitmapText).fontSize).toBe(20);
  });
  it("lists the event names as callbacks, without an on prefix", () => {
    expect(adapter.properties.callback).toContain("click");
    expect(adapter.properties.callback).not.toContain("onclick");
  });
  it("passes the defaults override through", () => {
    expect(pixi6({ defaults: { Text: { text: "" } } }).defaults).toEqual({ Text: { text: "" } });
    expect(adapter.defaults).toBeUndefined();
  });
  it("creates and destroys a PIXI.Application synchronously", () => {
    const app = adapter.createApplication({ width: 1, height: 1 });
    expect(app).toBeInstanceOf(PIXI.Application);
    expect(adapter.isApplication(app)).toBe(true);
    adapter.destroyApplication(app, false, true);
  });
  it("keeps the WebGL context of a canvas still in the document when it destroys an application", () => {
    const lost = (connected: boolean) => {
      const view = document.createElement("canvas");
      if (connected) document.body.appendChild(view);
      const app = adapter.createApplication({ height: 1, view, width: 1 }) as PIXI.Application;
      const loseContext = vi.spyOn((app.renderer as PIXI.Renderer).context.extensions.loseContext!, "loseContext");
      adapter.destroyApplication(app, false, true);
      view.remove();
      return loseContext.mock.calls.length;
    };
    expect(lost(true)).toBe(0);
    expect(lost(false)).toBe(1);
    const view = document.body.appendChild(document.createElement("canvas"));
    const canvasApp = { destroy: vi.fn(), renderer: { context: {} }, view };
    adapter.destroyApplication(canvasApp, false, true);
    expect(canvasApp.destroy).toHaveBeenCalledWith(false, true);
    view.remove();
  });
  it("releases a filter without destroy", () => {
    const filter = new PIXI.filters.AlphaFilter();
    const destroy = vi.spyOn(filter as unknown as { destroy(): void }, "destroy");
    adapter.releaseFilter!(filter);
    expect(destroy).not.toHaveBeenCalled();
  });
  it("handles points", () => {
    expect(adapter.isPoint(new PIXI.ObservablePoint(() => {}, null))).toBe(true);
    expect(adapter.isPoint([1, 2])).toBe(false);
    const target = new PIXI.Point();
    adapter.copyPoint(target, { x: 1, y: 2 });
    expect([target.x, target.y]).toEqual([1, 2]);
  });
});
