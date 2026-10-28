import { describe, it, expect, vi } from "vitest";
import * as PIXI from "pixi.js";
import { DISPLAY_OBJECT_TAGS, FILTER_TAGS, TAGS } from "../../react-pixi-fiber/src/tags";
import { configure } from "../../react-pixi-fiber/src/configure";
import react18, { strictModeBit } from "@react-pixi-fiber/react-18";
import {
  createInstance,
  diffProperties,
  setInitialProperties,
  updateProperties,
} from "../../react-pixi-fiber/src/ReactPixiFiberComponent";
import pixi7, { FXAAFilter, HTMLText, NineSlicePlane, SimpleMesh, SimplePlane, SimpleRope } from "../src/index";

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
  HTMLText: { text: "t" },
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
  AlphaFilter: PIXI.AlphaFilter,
  AnimatedSprite: PIXI.AnimatedSprite,
  BitmapText: PIXI.BitmapText,
  BlurFilter: PIXI.BlurFilter,
  ColorMatrixFilter: PIXI.ColorMatrixFilter,
  Container: PIXI.Container,
  DisplacementFilter: PIXI.DisplacementFilter,
  FXAAFilter: PIXI.FXAAFilter,
  Graphics: PIXI.Graphics,
  HTMLText: PIXI.HTMLText,
  Mesh: PIXI.Mesh,
  MeshPlane: PIXI.SimplePlane,
  MeshRope: PIXI.SimpleRope,
  MeshSimple: PIXI.SimpleMesh,
  NineSliceSprite: PIXI.NineSlicePlane,
  NoiseFilter: PIXI.NoiseFilter,
  ParticleContainer: PIXI.ParticleContainer,
  Sprite: PIXI.Sprite,
  Text: PIXI.Text,
  TilingSprite: PIXI.TilingSprite,
};

PIXI.BitmapFont.from("test", { fontFamily: "Arial" }, { chars: [["a", "z"]] });

describe("pixi7", () => {
  const adapter = pixi7();
  it("implements the 18 core tags, FXAAFilter, HTMLText and the four PixiJS 7 class-name aliases", () => {
    for (const tag of Object.keys(TAGS)) expect(typeof adapter.behaviors[tag].create, tag).toBe("function");
    const aliases = { NineSlicePlane, SimpleMesh, SimplePlane, SimpleRope } as Record<string, unknown>;
    for (const [name, value] of Object.entries(aliases)) expect(value).toBe(name);
    expect(adapter.behaviors.NineSlicePlane).toBe(adapter.behaviors.NineSliceSprite);
    expect(adapter.behaviors.SimpleMesh).toBe(adapter.behaviors.MeshSimple);
    expect(adapter.behaviors.SimplePlane).toBe(adapter.behaviors.MeshPlane);
    expect(adapter.behaviors.SimpleRope).toBe(adapter.behaviors.MeshRope);
    expect(Object.keys(adapter.behaviors).sort()).toEqual(
      [...Object.keys(TAGS), "FXAAFilter", "HTMLText", ...Object.keys(aliases)].sort()
    );
  });
  it("marks the filter tags, and no Display Object tag, with kind filter", () => {
    for (const tag of [...Object.keys(FILTER_TAGS), "FXAAFilter"])
      expect(adapter.behaviors[tag].kind, tag).toBe("filter");
    for (const tag of Object.keys(DISPLAY_OBJECT_TAGS)) expect(adapter.behaviors[tag].kind, tag).toBeUndefined();
  });
  it("creates every tag with the PixiJS 7 class", () => {
    for (const tag of [...Object.keys(TAGS), "FXAAFilter", "HTMLText"]) {
      expect(adapter.behaviors[tag].create(propsFor[tag]), tag).toBeInstanceOf(classFor[tag]);
    }
  });
  it("adds the FXAAFilter tag", () => {
    expect(FXAAFilter).toBe("FXAAFilter");
    expect(adapter.behaviors.FXAAFilter.create({})).toBeInstanceOf(PIXI.FXAAFilter);
  });
  it("passes the constructor arguments in order", () => {
    const create = (tag: string, props: Record<string, unknown>) => adapter.behaviors[tag].create(props) as any;
    const blur = create("BlurFilter", { blur: 3, kernelSize: 7, quality: 4, resolution: 2 });
    expect(blur).toBeInstanceOf(PIXI.BlurFilter);
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
  it("adds the HTMLText tag", () => {
    expect(HTMLText).toBe("HTMLText");
    expect(adapter.behaviors.HTMLText.create({ text: "x" })).toBeInstanceOf(PIXI.HTMLText);
  });
  it("creates a BitmapText from a fontName prop without a style, the props winning over the style", () => {
    const text = adapter.behaviors.BitmapText.create({ fontName: "test", text: "t" }) as PIXI.BitmapText;
    expect(text.fontName).toBe("test");
    const sized = adapter.behaviors.BitmapText.create({
      fontSize: 20,
      style: { fontName: "test", fontSize: 10 },
      text: "t",
    });
    expect((sized as PIXI.BitmapText).fontSize).toBe(20);
  });
  it("lists the on-prefixed event properties as callbacks, not the PixiJS 6 event names", () => {
    expect(adapter.properties.callback).toContain("onclick");
    expect(adapter.properties.callback).toContain("onglobalpointermove");
    expect(adapter.properties.callback).not.toContain("click");
    expect(adapter.properties.boolean).not.toContain("buttonMode");
  });
  it("passes the defaults override through", () => {
    expect(pixi7({ defaults: { Text: { text: "" } } }).defaults).toEqual({ Text: { text: "" } });
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
    const context = vi.fn(() => ({}));
    const renderer = {
      get context() {
        return context();
      },
      type: PIXI.RENDERER_TYPE.CANVAS,
    };
    const canvasApp = { destroy: vi.fn(), renderer, view };
    adapter.destroyApplication(canvasApp, false, true);
    expect(context).not.toHaveBeenCalled();
    expect(canvasApp.destroy).toHaveBeenCalledWith(false, true);
    view.remove();
  });
  it("handles points", () => {
    expect(adapter.isPoint(new PIXI.ObservablePoint(() => {}, null))).toBe(true);
    expect(adapter.isPoint([1, 2])).toBe(false);
    const target = new PIXI.Point();
    adapter.copyPoint(target, { x: 1, y: 2 });
    expect([target.x, target.y]).toEqual([1, 2]);
  });
});

describe("AnimatedSprite applyProps", () => {
  const frames = [texture, texture, texture];
  const behavior = pixi7().behaviors.AnimatedSprite;
  // Writes the changed props through the setters, the way the core does.
  function mount(props: Record<string, unknown>) {
    const animated = behavior.create(props) as PIXI.AnimatedSprite;
    const applied: Record<string, unknown>[] = [];
    const context = {
      applyDisplayObjectProps(oldProps: Record<string, unknown> | undefined, newProps: Record<string, unknown>) {
        applied.push(newProps);
        for (const key of Object.keys(newProps))
          if (oldProps?.[key] !== newProps[key]) (animated as any)[key] = newProps[key];
      },
    };
    let current = props;
    const update = (next: Record<string, unknown>) => {
      behavior.applyProps!.call(context as never, animated, current as never, next as never);
      current = next;
    };
    behavior.applyProps!.call(context as never, animated, undefined, props as never);
    return { animated, applied, update };
  }
  it("plays on mount when playing is true, and keeps playing out of the props it writes", () => {
    const { animated, applied } = mount({ playing: true, textures: frames });
    expect(animated.playing).toBe(true);
    expect(applied.every(props => !("playing" in props))).toBe(true);
    expect(mount({ textures: frames }).animated.playing).toBe(false);
  });
  it("plays and stops when playing changes", () => {
    const { animated, update } = mount({ playing: true, textures: frames });
    update({ playing: false, textures: frames });
    expect(animated.playing).toBe(false);
    update({ playing: true, textures: frames });
    expect(animated.playing).toBe(true);
  });
  it("keeps playing from frame 0 after a textures change when playing is true", () => {
    const { animated, update } = mount({ playing: true, textures: frames });
    animated.gotoAndPlay(2);
    update({ playing: true, textures: [texture, texture] });
    expect(animated.playing).toBe(true);
    expect(animated.currentFrame).toBe(0);
  });
  it("keeps the playback state across a textures change when playing is not set", () => {
    const playing = mount({ textures: frames });
    playing.animated.play();
    playing.update({ textures: [texture, texture] });
    expect(playing.animated.playing).toBe(true);
    const stopped = mount({ textures: frames });
    stopped.update({ textures: [texture, texture] });
    expect(stopped.animated.playing).toBe(false);
  });
  it("leaves a stop through a ref in place when other props change", () => {
    const { animated, update } = mount({ playing: true, textures: frames });
    animated.stop();
    update({ playing: true, textures: frames, x: 1 });
    expect(animated.playing).toBe(false);
    expect(animated.x).toBe(1);
  });
  it("stops when playing is removed", () => {
    const { animated, update } = mount({ playing: true, textures: frames });
    update({ textures: frames });
    expect(animated.playing).toBe(false);
  });
  it("plays a sprite with loop false that finished again from frame 0 when playing turns true", () => {
    const { animated, update } = mount({ loop: false, playing: true, textures: frames });
    animated.gotoAndPlay(2);
    animated.update(1);
    expect([animated.playing, animated.currentFrame]).toEqual([false, 2]);
    update({ loop: false, playing: false, textures: frames });
    update({ loop: false, playing: true, textures: frames });
    expect([animated.playing, animated.currentFrame]).toEqual([true, 0]);
  });
  it("resumes a sprite with loop false that stopped before its last frame", () => {
    const { animated, update } = mount({ loop: false, playing: true, textures: frames });
    animated.gotoAndPlay(1);
    update({ loop: false, playing: false, textures: frames });
    update({ loop: false, playing: true, textures: frames });
    expect([animated.playing, animated.currentFrame]).toEqual([true, 1]);
  });
});

describe("props after mount", () => {
  const strict = { mode: strictModeBit, return: null };
  // Creates the tag and writes its props through the core, then returns an `update` that writes a prop change the
  // way a commit does, under StrictMode.
  function mount(tag: string, props: Record<string, unknown>) {
    configure({ react: react18(), pixi: pixi7() });
    const instance = createInstance(tag, props) as any;
    setInitialProperties(tag, instance, props);
    let current = props;
    const update = (next: Record<string, unknown>) => {
      updateProperties(tag, instance, diffProperties(tag, instance, current, next) ?? [], current, next, strict);
      current = next;
    };
    return { instance, update };
  }
  function constructorWarnings(error: ReturnType<typeof vi.spyOn>, prop: string) {
    return error.mock.calls.filter((c: unknown[]) =>
      String(c[0]).includes(`reads \`${prop}\` only in its constructor`)
    );
  }

  it("keeps the Graphics geometry from the constructor and warns once when it changes", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const geometry = new PIXI.GraphicsGeometry();
    const { instance, update } = mount("Graphics", { geometry });
    expect(instance.geometry).toBe(geometry);
    expect(constructorWarnings(error, "geometry")).toHaveLength(0);
    update({ geometry: new PIXI.GraphicsGeometry() });
    update({ geometry: new PIXI.GraphicsGeometry() });
    expect(instance.geometry).toBe(geometry);
    expect(constructorWarnings(error, "geometry")).toHaveLength(__DEV__ ? 1 : 0);
    error.mockRestore();
  });

  const positions = (mesh: PIXI.Mesh) => mesh.geometry.getBuffer("aVertexPosition").data.length;

  it("writes the MeshSimple uvs and indices to the geometry buffers", () => {
    const vertices = new Float32Array([0, 0, 1, 0, 1, 1]);
    const { instance, update } = mount("MeshSimple", { texture, vertices });
    const uvs = new Float32Array([0, 0, 1, 0, 1, 1]);
    const indices = new Uint16Array([0, 1, 2]);
    update({ indices, texture, uvs, vertices });
    expect(instance.geometry.getBuffer("aTextureCoord").data).toBe(uvs);
    expect(instance.geometry.getIndex().data).toBe(indices);
  });

  it("writes MeshSimple indices given as an array as a Uint16Array", () => {
    const vertices = new Float32Array([0, 0, 1, 0, 1, 1]);
    const { instance, update } = mount("MeshSimple", { texture, vertices });
    update({ indices: [0, 1, 2], texture, vertices });
    expect(instance.geometry.getIndex().data).toEqual(new Uint16Array([0, 1, 2]));
  });

  it("rebuilds the MeshPlane geometry when verticesX or verticesY changes", () => {
    const { instance, update } = mount("MeshPlane", { texture, verticesX: 2, verticesY: 2 });
    expect(positions(instance)).toBe(2 * 2 * 2);
    update({ texture, verticesX: 3, verticesY: 4 });
    expect(positions(instance)).toBe(3 * 4 * 2);
  });

  it("rebuilds the MeshRope geometry when points or textureScale changes", () => {
    const two = [new PIXI.Point(0, 0), new PIXI.Point(10, 0)];
    const { instance, update } = mount("MeshRope", { points: two, texture });
    expect(positions(instance)).toBe(2 * 4);
    const three = [...two, new PIXI.Point(20, 0)];
    update({ points: three, texture, textureScale: 2 });
    expect(positions(instance)).toBe(3 * 4);
    expect(instance.geometry.points).toBe(three);
    expect(instance.geometry.textureScale).toBe(2);
  });

  it("gives the MeshSimple uvs and indices the constructor default when they are removed", () => {
    const vertices = new Float32Array([0, 0, 1, 0, 1, 1]);
    const { instance, update } = mount("MeshSimple", {
      indices: new Uint16Array([0, 1, 2]),
      texture,
      uvs: new Float32Array([0, 0, 1, 0, 1, 1]),
      vertices,
    });
    update({ texture, vertices });
    // PixiJS fills a buffer that gets no data with one float.
    expect(instance.geometry.getBuffer("aTextureCoord").data).toEqual(new Float32Array(1));
    expect(instance.geometry.getIndex().data).toEqual(new Float32Array(1));
  });

  it("rebuilds the MeshPlane geometry with 10 by 10 vertices when verticesX and verticesY are removed", () => {
    const { instance, update } = mount("MeshPlane", { texture, verticesX: 2, verticesY: 2 });
    update({ texture });
    expect(positions(instance)).toBe(10 * 10 * 2);
  });

  it("keeps the MeshRope points when they are removed, and sets textureScale back to 0", () => {
    const points = [new PIXI.Point(0, 0), new PIXI.Point(10, 0), new PIXI.Point(20, 0)];
    const { instance, update } = mount("MeshRope", { points, texture, textureScale: 2 });
    update({ texture });
    expect(instance.geometry.points).toBe(points);
    expect(instance.geometry.textureScale).toBe(0);
    expect(positions(instance)).toBe(3 * 4);
  });

  it("sets the ParticleContainer properties from the defaults and drops the buffers built with the old ones", () => {
    const { instance, update } = mount("ParticleContainer", { properties: { rotation: true, uvs: true } });
    instance._buffers = [];
    update({ properties: { scale: true } });
    expect(instance._properties).toEqual([true, true, false, false, false]);
    expect(instance._buffers).toBeNull();
  });

  it("warns once when the ParticleContainer maxSize or batchSize changes", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { update } = mount("ParticleContainer", { batchSize: 10, maxSize: 10 });
    update({ batchSize: 20, maxSize: 20 });
    update({ batchSize: 30, maxSize: 30 });
    expect(constructorWarnings(error, "batchSize")).toHaveLength(__DEV__ ? 1 : 0);
    expect(constructorWarnings(error, "maxSize")).toHaveLength(__DEV__ ? 1 : 0);
    error.mockRestore();
  });

  it("writes a changed BitmapText style through the setters of its keys, the props winning over the style", () => {
    const { instance, update } = mount("BitmapText", { style: { fontName: "test", fontSize: 10 }, text: "t" });
    update({ style: { align: "right", fontName: "test", fontSize: 20 }, text: "t" });
    expect([instance.align, instance.fontSize]).toEqual(["right", 20]);
    update({ fontSize: 30, style: { fontName: "test", fontSize: 20 }, text: "t" });
    expect(instance.fontSize).toBe(30);
  });

  it("warns once when the Text canvas changes", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const canvas = document.createElement("canvas");
    const { instance, update } = mount("Text", { canvas, text: "t" });
    expect(instance.canvas).toBe(canvas);
    update({ canvas: document.createElement("canvas"), text: "t" });
    expect(instance.canvas).toBe(canvas);
    expect(constructorWarnings(error, "canvas")).toHaveLength(__DEV__ ? 1 : 0);
    error.mockRestore();
  });
});
