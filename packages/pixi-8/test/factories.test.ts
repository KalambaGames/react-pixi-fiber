import { describe, it, expect, vi } from "vitest";
import * as PIXI from "pixi.js";
import { allClasses } from "../src/allClasses";
import { factories, type Pixi8Tag } from "../src/factories";

const texture = PIXI.Texture.WHITE;
const sprite = new PIXI.Sprite();
const propsFor: Record<Pixi8Tag, Record<string, unknown>> = {
  AlphaFilter: {},
  AnimatedSprite: { textures: [texture] },
  BitmapText: { style: { fill: 0xff0000 }, text: "t" },
  BlurFilter: {},
  ColorMatrixFilter: {},
  Container: {},
  DOMContainer: { element: document.createElement("div") },
  DisplacementFilter: { sprite },
  Graphics: {},
  HTMLText: { text: "t" },
  Mesh: { geometry: new PIXI.PlaneGeometry({ height: 1, verticesX: 2, verticesY: 2, width: 1 }), texture },
  MeshPlane: { texture, verticesX: 2, verticesY: 2 },
  MeshRope: { points: [new PIXI.Point(0, 0), new PIXI.Point(1, 0)], texture },
  MeshSimple: { texture, vertices: new Float32Array([0, 0, 1, 0, 1, 1]) },
  NineSliceSprite: { bottomHeight: 1, leftWidth: 1, rightWidth: 1, texture, topHeight: 1 },
  NoiseFilter: {},
  Particle: { texture },
  ParticleContainer: { texture },
  PerspectiveMesh: { texture, x1: 10 },
  RenderContainer: { render: () => {} },
  RenderLayer: {},
  Sprite: { texture },
  Text: { style: { fill: 0xff0000 }, text: "t" },
  TilingSprite: { height: 1, texture, width: 1 },
};
const classFor: Record<Pixi8Tag, new (...args: any[]) => unknown> = {
  AlphaFilter: PIXI.AlphaFilter,
  AnimatedSprite: PIXI.AnimatedSprite,
  BitmapText: PIXI.BitmapText,
  BlurFilter: PIXI.BlurFilter,
  ColorMatrixFilter: PIXI.ColorMatrixFilter,
  Container: PIXI.Container,
  DOMContainer: PIXI.DOMContainer,
  DisplacementFilter: PIXI.DisplacementFilter,
  Graphics: PIXI.Graphics,
  HTMLText: PIXI.HTMLText,
  Mesh: PIXI.Mesh,
  MeshPlane: PIXI.MeshPlane,
  MeshRope: PIXI.MeshRope,
  MeshSimple: PIXI.MeshSimple,
  NineSliceSprite: PIXI.NineSliceSprite,
  NoiseFilter: PIXI.NoiseFilter,
  Particle: PIXI.Particle,
  ParticleContainer: PIXI.ParticleContainer,
  PerspectiveMesh: PIXI.PerspectiveMesh,
  RenderContainer: PIXI.RenderContainer,
  RenderLayer: PIXI.RenderLayer,
  Sprite: PIXI.Sprite,
  Text: PIXI.Text,
  TilingSprite: PIXI.TilingSprite,
};

describe("factories", () => {
  it("has one factory per tag, the keys of allClasses minus Application", () => {
    expect(Object.keys(factories)).toEqual(Object.keys(allClasses).filter(key => key !== "Application"));
  });
  it("creates every tag with the class it is given", () => {
    for (const tag of Object.keys(classFor) as Pixi8Tag[]) {
      const behavior = factories[tag](allClasses[tag] as never, allClasses);
      expect(behavior.create(propsFor[tag]), tag).toBeInstanceOf(classFor[tag]);
    }
  });
  it("leaves out constructor options that are not set, so the PixiJS defaults apply", () => {
    const mesh = factories
      .PerspectiveMesh(PIXI.PerspectiveMesh, allClasses)
      .create({ texture }) as PIXI.PerspectiveMesh;
    expect(mesh.geometry.positions.every(Number.isFinite)).toBe(true);
    expect((factories.Text(PIXI.Text, allClasses).create({}) as PIXI.Text).text).toBe("");
  });
  it("AlphaFilter creates the filter with alpha when it is set", () => {
    const args: unknown[][] = [];
    class Recorded extends PIXI.AlphaFilter {
      constructor(...rest: [PIXI.AlphaFilterOptions]) {
        super(...rest);
        args.push(rest);
      }
    }
    const behavior = factories.AlphaFilter(Recorded as never, allClasses);
    const filter = behavior.create({ alpha: 0.5 }) as PIXI.AlphaFilter;
    behavior.create({});
    expect(behavior.kind).toBe("filter");
    expect(filter).toBeInstanceOf(PIXI.AlphaFilter);
    expect(filter.alpha).toBe(0.5);
    expect(args).toStrictEqual([[{ alpha: 0.5 }], [{}]]);
  });
  it("BlurFilter creates the filter with the blur options that are set", () => {
    const args: unknown[][] = [];
    class Recorded extends PIXI.BlurFilter {
      constructor(...rest: [PIXI.BlurFilterOptions]) {
        super(...rest);
        args.push(rest);
      }
    }
    const behavior = factories.BlurFilter(Recorded as never, allClasses);
    const props = { kernelSize: 7, quality: 2, resolution: 2, strength: 5, strengthX: 3, strengthY: 4 };
    const filter = behavior.create(props) as PIXI.BlurFilter;
    behavior.create({ strength: 6 });
    expect(behavior.kind).toBe("filter");
    expect(filter).toBeInstanceOf(PIXI.BlurFilter);
    expect(args).toEqual([[props], [{ strength: 6 }]]);
    expect([filter.quality, filter.resolution, filter.strengthX, filter.strengthY]).toEqual([2, 2, 3, 4]);
  });
  it("ColorMatrixFilter creates the filter with no arguments", () => {
    const args: unknown[][] = [];
    class Recorded extends PIXI.ColorMatrixFilter {
      constructor(...rest: unknown[]) {
        super();
        args.push(rest);
      }
    }
    const behavior = factories.ColorMatrixFilter(Recorded, allClasses);
    const filter = behavior.create({});
    expect(behavior.kind).toBe("filter");
    expect(filter).toBeInstanceOf(PIXI.ColorMatrixFilter);
    expect(args).toEqual([[]]);
  });
  it("DisplacementFilter creates the filter with sprite only", () => {
    const args: unknown[][] = [];
    class Recorded extends PIXI.DisplacementFilter {
      constructor(...rest: [PIXI.DisplacementFilterOptions]) {
        super(...rest);
        args.push(rest);
      }
    }
    const behavior = factories.DisplacementFilter(Recorded as never, allClasses);
    const filter = behavior.create({ scale: 10, sprite });
    expect(behavior.kind).toBe("filter");
    expect(filter).toBeInstanceOf(PIXI.DisplacementFilter);
    expect(args).toHaveLength(1);
    expect(args[0]).toHaveLength(1);
    const [options] = args[0] as [PIXI.DisplacementFilterOptions];
    expect(Object.keys(options)).toStrictEqual(["sprite"]);
    expect(options.sprite).toBe(sprite);
  });
  it("Graphics destroys the context it creates when the renderer destroys it", () => {
    const graphics = factories.Graphics(PIXI.Graphics, allClasses).create({}) as PIXI.Graphics;
    const { context } = graphics;
    graphics.destroy({ children: true });
    expect(context.destroyed).toBe(true);
  });
  it("Graphics destroys the context it creates when a destroyed parent destroys it", () => {
    const parent = new PIXI.Container();
    const graphics = factories.Graphics(PIXI.Graphics, allClasses).create({}) as PIXI.Graphics;
    const { context } = graphics;
    parent.addChild(graphics);
    parent.destroy({ children: true });
    expect(context.destroyed).toBe(true);
  });
  it("Graphics destroys the context it creates once when PixiJS destroys it too", () => {
    for (const options of [undefined, true] as const) {
      const graphics = factories.Graphics(PIXI.Graphics, allClasses).create({}) as PIXI.Graphics;
      const destroy = vi.spyOn(graphics.context, "destroy");
      graphics.destroy(options);
      expect(destroy, String(options)).toHaveBeenCalledOnce();
    }
  });
  it("Graphics keeps a context from the context prop", () => {
    const context = new PIXI.GraphicsContext();
    const graphics = factories.Graphics(PIXI.Graphics, allClasses).create({ context }) as PIXI.Graphics;
    graphics.destroy({ children: true });
    expect(context.destroyed).toBe(false);
  });
  it("Graphics destroys the context it creates after the context prop replaces it, and keeps the new one", () => {
    const graphics = factories.Graphics(PIXI.Graphics, allClasses).create({}) as PIXI.Graphics;
    const owned = graphics.context;
    const context = new PIXI.GraphicsContext();
    graphics.context = context;
    graphics.destroy({ children: true });
    expect(owned.destroyed).toBe(true);
    expect(context.destroyed).toBe(false);
  });
  it("NoiseFilter creates the filter with the noise and seed that are set", () => {
    const args: unknown[][] = [];
    class Recorded extends PIXI.NoiseFilter {
      constructor(...rest: [PIXI.NoiseFilterOptions]) {
        super(...rest);
        args.push(rest);
      }
    }
    const behavior = factories.NoiseFilter(Recorded as never, allClasses);
    const filter = behavior.create({ noise: 0.25, seed: 0.75 }) as PIXI.NoiseFilter;
    behavior.create({ noise: 0.25 });
    expect(behavior.kind).toBe("filter");
    expect(filter).toBeInstanceOf(PIXI.NoiseFilter);
    expect([filter.noise, filter.seed]).toEqual([0.25, 0.75]);
    expect(args).toStrictEqual([[{ noise: 0.25, seed: 0.75 }], [{ noise: 0.25 }]]);
  });
  it("ParticleContainer throws when it inserts before a particle it does not hold", () => {
    const { create, insertBefore } = factories.ParticleContainer(PIXI.ParticleContainer, allClasses);
    const container = create({});
    expect(() => insertBefore?.(container, new PIXI.Particle(texture), new PIXI.Particle(texture))).toThrow(
      "`ParticleContainer` cannot insert a `Particle` before one it does not hold."
    );
  });
  it("ParticleContainer rejects a child that is not classes.Particle", () => {
    const { create, appendChild } = factories.ParticleContainer(PIXI.ParticleContainer, allClasses);
    expect(() => appendChild?.(create({}), new PIXI.Sprite(texture))).toThrow(
      "`ParticleContainer` takes only `Particle` children from `@react-pixi-fiber/pixi-8`, not Scene Objects."
    );
  });
});

describe("AnimatedSprite applyProps", () => {
  const frames = [texture, texture, texture];
  const behavior = factories.AnimatedSprite(PIXI.AnimatedSprite, allClasses);
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
    animated.update({ deltaMS: 16, deltaTime: 1 } as never);
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
