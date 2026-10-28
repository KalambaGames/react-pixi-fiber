import { describe, it, expect, vi } from "vitest";
import * as PIXI from "pixi.js";
import { DISPLAY_OBJECT_TAGS, FILTER_TAGS, TAGS } from "../../react-pixi-fiber/src/tags";
import { configure } from "../../react-pixi-fiber/src/configure";
import {
  createInstance,
  diffProperties,
  setInitialProperties,
  updateProperties,
} from "../../react-pixi-fiber/src/ReactPixiFiberComponent";
import pixi4, { FXAAFilter, NineSlicePlane, Plane, Rope } from "../src/index";

const texture = PIXI.Texture.WHITE;
const propsFor: Record<string, Record<string, unknown>> = {
  AlphaFilter: {},
  AnimatedSprite: { textures: [texture] },
  BitmapText: { style: { font: "10px test" }, text: "t" },
  BlurFilter: {},
  ColorMatrixFilter: {},
  Container: {},
  DisplacementFilter: { sprite: new PIXI.Sprite(texture) },
  FXAAFilter: {},
  Graphics: {},
  Mesh: { indices: new Uint16Array([0, 1, 2]), texture, uvs: new Float32Array(6), vertices: new Float32Array(6) },
  MeshPlane: { texture, verticesX: 2, verticesY: 2 },
  MeshRope: { points: [new PIXI.Point(0, 0), new PIXI.Point(1, 1)], texture },
  MeshSimple: { indices: new Uint16Array([0, 1, 2]), texture, uvs: new Float32Array(6), vertices: new Float32Array(6) },
  NineSliceSprite: { bottomHeight: 1, leftWidth: 1, rightWidth: 1, texture, topHeight: 1 },
  NoiseFilter: {},
  ParticleContainer: {},
  Sprite: { texture },
  Text: { text: "t" },
  TilingSprite: { height: 1, texture, width: 1 },
};
const classFor: Record<string, new (...args: any[]) => unknown> = {
  AlphaFilter: PIXI.filters.AlphaFilter,
  AnimatedSprite: PIXI.extras.AnimatedSprite,
  BitmapText: PIXI.extras.BitmapText,
  BlurFilter: PIXI.filters.BlurFilter,
  ColorMatrixFilter: PIXI.filters.ColorMatrixFilter,
  Container: PIXI.Container,
  DisplacementFilter: PIXI.filters.DisplacementFilter,
  FXAAFilter: PIXI.filters.FXAAFilter,
  Graphics: PIXI.Graphics,
  Mesh: PIXI.mesh.Mesh,
  MeshPlane: PIXI.mesh.Plane,
  MeshRope: PIXI.mesh.Rope,
  MeshSimple: PIXI.mesh.Mesh,
  NineSliceSprite: PIXI.mesh.NineSlicePlane,
  NoiseFilter: PIXI.filters.NoiseFilter,
  ParticleContainer: PIXI.particles.ParticleContainer,
  Sprite: PIXI.Sprite,
  Text: PIXI.Text,
  TilingSprite: PIXI.extras.TilingSprite,
};

const fontXml = new DOMParser().parseFromString(
  `<font>
    <info face="test" size="10"/>
    <common lineHeight="10" base="8"/>
    <pages><page id="0" file="test.png"/></pages>
    <chars count="1"><char id="116" x="0" y="0" width="1" height="1" xoffset="0" yoffset="0" xadvance="1" page="0"/></chars>
  </font>`,
  "text/xml"
);
PIXI.extras.BitmapText.registerFont(fontXml, texture);

describe("pixi4", () => {
  const adapter = pixi4();
  it("implements the 18 core tags, FXAAFilter and the three PixiJS 4 class-name aliases", () => {
    for (const tag of Object.keys(TAGS)) expect(typeof adapter.behaviors[tag].create, tag).toBe("function");
    const aliases = { NineSlicePlane, Plane, Rope } as Record<string, unknown>;
    for (const [name, value] of Object.entries(aliases)) expect(value).toBe(name);
    expect(adapter.behaviors.NineSlicePlane).toBe(adapter.behaviors.NineSliceSprite);
    expect(adapter.behaviors.Plane).toBe(adapter.behaviors.MeshPlane);
    expect(adapter.behaviors.Rope).toBe(adapter.behaviors.MeshRope);
    expect(Object.keys(adapter.behaviors).sort()).toEqual(
      [...Object.keys(TAGS), "FXAAFilter", ...Object.keys(aliases)].sort()
    );
  });
  it("marks the filter tags, and no Display Object tag, with kind filter", () => {
    for (const tag of [...Object.keys(FILTER_TAGS), "FXAAFilter"])
      expect(adapter.behaviors[tag].kind, tag).toBe("filter");
    for (const tag of Object.keys(DISPLAY_OBJECT_TAGS)) expect(adapter.behaviors[tag].kind, tag).toBeUndefined();
  });
  it("creates every core tag with the PixiJS 4 class", () => {
    for (const tag of Object.keys(TAGS)) {
      expect(adapter.behaviors[tag].create(propsFor[tag]), tag).toBeInstanceOf(classFor[tag]);
    }
  });
  it("adds the FXAAFilter tag", () => {
    expect(FXAAFilter).toBe("FXAAFilter");
    expect(adapter.behaviors.FXAAFilter.create({})).toBeInstanceOf(PIXI.filters.FXAAFilter);
  });
  it("passes the constructor arguments in order", () => {
    const create = (tag: string, props: Record<string, unknown>) => adapter.behaviors[tag].create(props) as any;
    const blur = create("BlurFilter", { blur: 3, kernelSize: 7, quality: 4, resolution: 2 });
    expect(blur).toBeInstanceOf(PIXI.filters.BlurFilter);
    expect([blur.blur, blur.quality, blur.resolution]).toEqual([3, 4, 2]);
    // PixiJS keeps no kernelSize property: the size is the length of the coordinate array in the shader.
    expect(blur.blurXFilter.vertexSrc).toContain("vBlurTexCoords[7];");
    const noise = create("NoiseFilter", { noise: 0.25, seed: 42 });
    expect([noise.noise, noise.seed]).toEqual([0.25, 42]);
    const sprite = new PIXI.Sprite(texture);
    const displacement = create("DisplacementFilter", { scale: 7, sprite });
    expect(displacement.scale.x).toBe(7);
    expect(displacement.maskSprite).toBe(sprite);
    expect(create("AlphaFilter", { alpha: 0.5 }).alpha).toBe(0.5);
  });
  it("creates a BitmapText from a font prop beside a style, the props winning over the style", () => {
    const text = adapter.behaviors.BitmapText.create({ font: "10px test", style: { align: "center" }, text: "t" });
    expect((text as PIXI.extras.BitmapText).font).toMatchObject({ align: "center", name: "test", size: 10 });
    const sized = adapter.behaviors.BitmapText.create({ font: "20px test", style: { font: "10px test" }, text: "t" });
    expect((sized as PIXI.extras.BitmapText).font).toMatchObject({ size: 20 });
  });
  it("creates Mesh and MeshSimple as the one PixiJS 4 mesh class with the constructor arguments", () => {
    for (const tag of ["Mesh", "MeshSimple"]) {
      const created = adapter.behaviors[tag].create(propsFor[tag]) as PIXI.mesh.Mesh;
      expect(created.constructor, tag).toBe(PIXI.mesh.Mesh);
      expect(created.texture, tag).toBe(texture);
      expect(created.vertices, tag).toBe(propsFor[tag].vertices);
      expect(created.uvs, tag).toBe(propsFor[tag].uvs);
      expect(created.indices, tag).toBe(propsFor[tag].indices);
    }
  });
  it("lists the event names as callbacks, without an on prefix", () => {
    expect(adapter.properties.callback).toContain("click");
    expect(adapter.properties.callback).not.toContain("onclick");
  });
  it("passes the defaults override through", () => {
    expect(pixi4({ defaults: { Text: { text: "" } } }).defaults).toEqual({ Text: { text: "" } });
    expect(adapter.defaults).toBeUndefined();
  });
  it("creates and destroys a PIXI.Application synchronously", () => {
    const app = adapter.createApplication({ forceCanvas: true, height: 1, width: 1 });
    expect(app).toBeInstanceOf(PIXI.Application);
    expect(adapter.isApplication(app)).toBe(true);
    adapter.destroyApplication(app, false, true);
  });
  it("keeps the WebGL context of a canvas still in the document when it destroys an application", () => {
    const lost = (connected: boolean, getExtension?: () => unknown) => {
      const view = document.createElement("canvas");
      if (connected) document.body.appendChild(view);
      const gl = view.getContext("webgl") as any;
      if (getExtension) gl.getExtension = getExtension;
      const original = gl.getExtension;
      const loseContext = vi.spyOn(gl.getExtension("WEBGL_lose_context"), "loseContext");
      // What WebGLRenderer.destroy does with the context; the WebGL mock cannot construct a PixiJS 4 WebGLRenderer.
      const app = {
        destroy: vi.fn(() => gl.getExtension("WEBGL_lose_context")?.loseContext()),
        renderer: { gl },
        view,
      };
      adapter.destroyApplication(app, false, true);
      view.remove();
      expect(app.destroy).toHaveBeenCalledWith(false, true);
      expect(gl.getExtension).toBe(original);
      expect(Object.prototype.hasOwnProperty.call(gl, "getExtension")).toBe(getExtension !== undefined);
      return loseContext.mock.calls.length;
    };
    expect(lost(true)).toBe(0);
    expect(lost(false)).toBe(1);
    const extension = { loseContext() {} };
    expect(lost(true, () => extension)).toBe(0);
    const view = document.body.appendChild(document.createElement("canvas"));
    const canvasApp = adapter.createApplication({ forceCanvas: true, height: 1, view, width: 1 });
    adapter.destroyApplication(canvasApp, false, true);
    view.remove();
  });
  it("handles points, copying with copy()", () => {
    expect(adapter.isPoint(new PIXI.ObservablePoint(() => {}, null))).toBe(true);
    expect(adapter.isPoint([1, 2])).toBe(false);
    const target = new PIXI.Point();
    adapter.copyPoint(target, new PIXI.Point(3, 4));
    expect([target.x, target.y]).toEqual([3, 4]);
  });
});

describe("AnimatedSprite applyProps", () => {
  const frames = [texture, texture, texture];
  const behavior = pixi4().behaviors.AnimatedSprite;
  // Writes the changed props through the setters, the way the core does.
  function mount(props: Record<string, unknown>) {
    const animated = behavior.create(props) as PIXI.extras.AnimatedSprite;
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
    (animated as any).update(1);
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
  // The core needs a React adapter only for its StrictMode bit and stack addendum here, so a stub stands in for it.
  const react18 = () => ({ createRenderer: () => ({ getStackAddendum: () => "" }), strictModeBit: 1 }) as never;
  const strict = { mode: 1, return: null };
  // Creates the tag and writes its props through the core, then returns an `update` that writes a prop change the
  // way a commit does, under StrictMode.
  function mount(tag: string, props: Record<string, unknown>) {
    configure({ react: react18(), pixi: pixi4() });
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

  it("marks the Mesh uvs and indices for upload when they change", () => {
    const vertices = new Float32Array(6);
    const { instance, update } = mount("Mesh", { texture, vertices });
    const [dirty, indexDirty] = [instance.dirty, instance.indexDirty];
    const uvs = new Float32Array(6);
    const indices = new Uint16Array([0, 1, 2]);
    update({ indices, texture, uvs, vertices });
    expect([instance.uvs, instance.indices]).toEqual([uvs, indices]);
    expect([instance.dirty, instance.indexDirty]).toEqual([dirty + 1, indexDirty + 1]);
  });

  it("rebuilds the MeshPlane when verticesX or verticesY changes", () => {
    const { instance, update } = mount("MeshPlane", { texture, verticesX: 2, verticesY: 2 });
    expect(instance.vertices.length).toBe(2 * 2 * 2);
    update({ texture, verticesX: 3, verticesY: 4 });
    expect(instance.vertices.length).toBe(3 * 4 * 2);
  });

  it("rebuilds the MeshRope when the number of points changes", () => {
    const two = [new PIXI.Point(0, 0), new PIXI.Point(10, 0)];
    const { instance, update } = mount("MeshRope", { points: two, texture });
    expect(instance.vertices.length).toBe(2 * 4);
    update({ points: [...two, new PIXI.Point(20, 0)], texture });
    expect(instance.vertices.length).toBe(3 * 4);
  });

  it("gives the Mesh uvs and indices the constructor default when they are removed", () => {
    const vertices = new Float32Array(6);
    const { instance, update } = mount("Mesh", {
      indices: new Uint16Array([0, 1, 2]),
      texture,
      uvs: new Float32Array(6),
      vertices,
    });
    const [dirty, indexDirty] = [instance.dirty, instance.indexDirty];
    update({ texture, vertices });
    expect(instance.uvs).toEqual(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]));
    expect(instance.indices).toEqual(new Uint16Array([0, 1, 3, 2]));
    expect([instance.dirty, instance.indexDirty]).toEqual([dirty + 1, indexDirty + 1]);
  });

  it("rebuilds the MeshPlane with 10 by 10 vertices when verticesX and verticesY are removed", () => {
    const { instance, update } = mount("MeshPlane", { texture, verticesX: 2, verticesY: 2 });
    update({ texture });
    expect(instance.vertices.length).toBe(10 * 10 * 2);
  });

  it("keeps the MeshRope points when they are removed", () => {
    const two = [new PIXI.Point(0, 0), new PIXI.Point(10, 0)];
    const three = [...two, new PIXI.Point(20, 0)];
    const { instance, update } = mount("MeshRope", { points: two, texture });
    update({ points: three, texture });
    update({ texture });
    expect(instance.points).toBe(three);
    expect(instance.vertices.length).toBe(3 * 4);
  });

  it("warns once when a ParticleContainer constructor argument changes", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { update } = mount("ParticleContainer", { batchSize: 10, maxSize: 10, properties: { rotation: true } });
    update({ batchSize: 20, maxSize: 20, properties: { uvs: true } });
    update({ batchSize: 30, maxSize: 30, properties: { tint: true } });
    for (const prop of ["batchSize", "maxSize", "properties"])
      expect(constructorWarnings(error, prop), prop).toHaveLength(__DEV__ ? 1 : 0);
    error.mockRestore();
  });

  it("warns once when the AnimatedSprite autoUpdate changes", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const textures = [texture, texture];
    const { update } = mount("AnimatedSprite", { autoUpdate: true, textures });
    update({ autoUpdate: false, textures });
    update({ autoUpdate: true, textures });
    expect(constructorWarnings(error, "autoUpdate")).toHaveLength(__DEV__ ? 1 : 0);
    error.mockRestore();
  });

  it("writes a changed BitmapText style through the setters of its keys, the props winning over the style", () => {
    const { instance, update } = mount("BitmapText", { style: { font: "10px test" }, text: "t" });
    update({ style: { align: "right", font: "20px test" }, text: "t" });
    expect(instance.align).toBe("right");
    expect(instance.font).toMatchObject({ size: 20 });
    update({ font: "30px test", style: { align: "right", font: "20px test" }, text: "t" });
    expect(instance.font).toMatchObject({ size: 30 });
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
