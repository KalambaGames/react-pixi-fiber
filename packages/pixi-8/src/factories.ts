import type * as PIXI from "pixi.js";
import type { Behavior } from "react-pixi-fiber";
import type { Pixi8Classes } from "./types";

export type Pixi8Tag = Exclude<keyof Pixi8Classes, "Application">;
export type Factory<K extends Pixi8Tag> = (Ctor: Pixi8Classes[K], classes: Partial<Pixi8Classes>) => Behavior;

// PixiJS 8 constructors spread their options over the class defaults, so a key set to `undefined` would win over the
// default. Only the props that are set are passed.
function defined<T extends Record<string, unknown>>(options: T): T {
  const out = {} as T;
  for (const key in options) if (options[key] !== undefined) out[key] = options[key];
  return out;
}

// `strength` sets both axes, and PixiJS's `strength` getter throws while they differ. So the props reach the pipeline
// as the two axes, each falling back to `strength` as in the constructor.
function blurAxes<P extends Record<string, unknown>>(props: P): P;
function blurAxes<P extends Record<string, unknown>>(props: P | undefined): P | undefined;
function blurAxes<P extends Record<string, unknown>>(props: P | undefined): P | undefined {
  if (props === undefined) return undefined;
  const { strength, ...rest } = props;
  if (strength === undefined) return rest as unknown as P;
  return { ...rest, strengthX: rest.strengthX ?? strength, strengthY: rest.strengthY ?? strength } as unknown as P;
}

// Whether one of `keys` changed after mount. The core writes these constructor options to the instance as well, where
// PixiJS does not read them, so `applyProps` passes them to the geometry.
function changed(oldProps: Record<string, unknown> | undefined, newProps: Record<string, unknown>, keys: string[]) {
  return oldProps !== undefined && keys.some(key => oldProps[key] !== newProps[key]);
}

// `build` takes the size from the geometry first, so a removed size gets the PlaneGeometry default.
function rebuildPlane(geometry: PIXI.PlaneGeometry, props: Record<string, any>) {
  geometry.verticesX = props.verticesX;
  geometry.verticesY = props.verticesY;
  geometry.build({});
}

const CORNERS = ["x0", "y0", "x1", "y1", "x2", "y2", "x3", "y3"];

// A particle has no parent pointer, so a prop change finds the container to `update()` here.
const particleParents = new WeakMap<PIXI.Particle, PIXI.ParticleContainer>();

function asParticle(child: unknown, Particle: Pixi8Classes["Particle"] | undefined): PIXI.Particle {
  if (Particle === undefined || !(child instanceof Particle)) {
    throw new Error(
      "`ParticleContainer` takes only `Particle` children from `@react-pixi-fiber/pixi-8`, not Scene Objects."
    );
  }
  return child;
}

// The buffer attributes each prop of a Particle feeds. A prop not listed here re-uploads everything.
const PARTICLE_ATTRIBUTES: Record<string, string[]> = {
  alpha: ["color"],
  anchorX: ["vertex"],
  anchorY: ["vertex"],
  rotation: ["rotation"],
  scaleX: ["vertex"],
  scaleY: ["vertex"],
  texture: ["uvs", "vertex"],
  tint: ["color"],
  x: ["position"],
  y: ["position"],
};

// PixiJS uploads the dynamic attributes every frame and the static ones only after `update()`.
function changesStaticAttributes(
  container: PIXI.ParticleContainer,
  oldProps: Record<string, unknown> = {},
  newProps: Record<string, unknown>
): boolean {
  for (const key of new Set([...Object.keys(oldProps), ...Object.keys(newProps)])) {
    if (key === "children" || oldProps[key] === newProps[key]) continue;
    const attributes = PARTICLE_ATTRIBUTES[key];
    if (attributes === undefined || !attributes.every(name => container._properties[name]?.dynamic)) return true;
  }
  return false;
}

export const factories: { [K in Pixi8Tag]: Factory<K> } = {
  AlphaFilter: Ctor => ({ kind: "filter", create: p => new Ctor(defined({ alpha: p.alpha })) }),
  // `playing` calls `play()` or `stop()` and does not write a property. The `textures` setter stops the sprite, so
  // `applyProps` sets the playback after the other props. Without `playing`, a sprite that played before a `textures`
  // change plays again after it. A removed `playing` stops the sprite, as before the first `play()`. A finished sprite
  // with `loop` false plays again from frame 0, like a media element that ended.
  AnimatedSprite: Ctor => ({
    create: p => new Ctor(p.textures, p.autoUpdate),
    applyProps(animated: PIXI.AnimatedSprite, oldProps, newProps) {
      const { playing: oldPlaying, ...oldRest } = oldProps ?? {};
      const { playing, ...props } = newProps;
      const wasPlaying = animated.playing;
      this.applyDisplayObjectProps(oldProps && oldRest, props);
      const texturesChanged = oldProps !== undefined && oldRest.textures !== props.textures;
      if (playing !== oldPlaying || texturesChanged) {
        if (!(playing ?? (oldPlaying === undefined && wasPlaying))) animated.stop();
        else if (!animated.playing && !animated.loop && animated.currentFrame === animated.totalFrames - 1)
          animated.gotoAndPlay(0);
        else animated.play();
      }
    },
  }),
  BitmapText: Ctor => ({ create: p => new Ctor(defined({ style: p.style, text: p.text })) }),
  BlurFilter: Ctor => ({
    kind: "filter",
    create: p =>
      new Ctor(
        defined({
          kernelSize: p.kernelSize,
          quality: p.quality,
          resolution: p.resolution,
          strength: p.strength,
          strengthX: p.strengthX,
          strengthY: p.strengthY,
        })
      ),
    applyProps(_filter, oldProps, newProps) {
      this.applyDisplayObjectProps(blurAxes(oldProps), blurAxes(newProps));
    },
  }),
  ColorMatrixFilter: Ctor => ({ kind: "filter", create: () => new Ctor() }),
  Container: Ctor => ({ create: () => new Ctor() }),
  DOMContainer: Ctor => ({ create: p => new Ctor(defined({ anchor: p.anchor, element: p.element })) }),
  // The constructor keeps a `{ x, y }` scale as is, not as the Point the props write into. So `scale` goes through the
  // props.
  DisplacementFilter: Ctor => ({ kind: "filter", create: p => new Ctor(defined({ sprite: p.sprite })) }),
  // PixiJS 8 destroys the context that a Graphics creates only on `destroy()` with no options. The renderer passes
  // `{ children: true }`, so this factory destroys that context. A context from the `context` prop stays the user's.
  // PixiJS 8.9 has no `destroyed` flag, and a second `destroy()` throws. Null `instructions` shows a destroyed context.
  Graphics: Ctor => ({
    create: p => {
      const graphics = new Ctor(p.context);
      if (p.context == null) {
        const owned = graphics.context;
        graphics.once("destroyed", () => {
          if (owned.instructions) owned.destroy();
        });
      }
      return graphics;
    },
  }),
  HTMLText: Ctor => ({ create: p => new Ctor(defined({ style: p.style, text: p.text })) }),
  Mesh: Ctor => ({
    create: p => new Ctor(defined({ geometry: p.geometry, shader: p.shader, state: p.state, texture: p.texture })),
  }),
  MeshPlane: Ctor => ({
    create: p => new Ctor(defined({ texture: p.texture, verticesX: p.verticesX, verticesY: p.verticesY })),
    applyProps(mesh: PIXI.MeshPlane, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      if (changed(oldProps, newProps, ["verticesX", "verticesY"]))
        rebuildPlane(mesh.geometry as PIXI.PlaneGeometry, newProps);
    },
  }),
  // RopeGeometry resizes its buffers only in a private method, so a new geometry replaces the one the constructor
  // built, which is destroyed with its buffers. Without `points` the rope keeps the points it has, because PixiJS
  // cannot build a rope with none.
  MeshRope: Ctor => ({
    create: p => new Ctor(defined({ points: p.points, texture: p.texture, textureScale: p.textureScale })),
    applyProps(rope: PIXI.MeshRope, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      if (!changed(oldProps, newProps, ["points", "textureScale"])) return;
      const old = rope.geometry as PIXI.RopeGeometry;
      const Geometry = old.constructor as typeof PIXI.RopeGeometry;
      const textureScale = newProps.textureScale ?? Ctor.defaultOptions.textureScale;
      rope.geometry = new Geometry({ points: newProps.points ?? old.points, textureScale, width: old.width });
      old.destroy(true);
      if (textureScale > 0) rope.texture.source.style.addressMode = "repeat";
    },
  }),
  // A removed `indices`, `topology` or `uvs` gets the value the constructor gives a mesh with vertices.
  MeshSimple: Ctor => ({
    create: p =>
      new Ctor(
        defined({ indices: p.indices, texture: p.texture, topology: p.topology, uvs: p.uvs, vertices: p.vertices })
      ),
    applyProps(mesh: PIXI.MeshSimple, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      const geometry = mesh.geometry as PIXI.MeshGeometry;
      if (changed(oldProps, newProps, ["uvs"]))
        geometry.uvs = newProps.uvs ?? new Float32Array(geometry.positions.length);
      if (changed(oldProps, newProps, ["indices"]))
        geometry.indices = newProps.indices ?? new Uint32Array([0, 1, 2, 0, 2, 3]);
      if (changed(oldProps, newProps, ["topology"])) geometry.topology = newProps.topology ?? "triangle-list";
    },
  }),
  NineSliceSprite: Ctor => ({
    create: p =>
      new Ctor(
        defined({
          bottomHeight: p.bottomHeight,
          leftWidth: p.leftWidth,
          rightWidth: p.rightWidth,
          texture: p.texture,
          topHeight: p.topHeight,
        })
      ),
  }),
  NoiseFilter: Ctor => ({ kind: "filter", create: p => new Ctor(defined({ noise: p.noise, seed: p.seed })) }),
  Particle: Ctor => ({
    create: p => {
      if (p.texture == null) throw new Error("`Particle` needs a `texture` prop.");
      return new Ctor(p.texture);
    },
    applyProps(particle: PIXI.Particle, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      const container = particleParents.get(particle);
      if (container && changesStaticAttributes(container, oldProps, newProps)) container.update();
    },
  }),
  // The renderer reads `dynamicProperties` when it first draws the container.
  ParticleContainer: (Ctor, classes) => ({
    constructorOnly: ["dynamicProperties"],
    create: p =>
      new Ctor(
        defined({
          dynamicProperties: p.dynamicProperties,
          roundPixels: p.roundPixels,
          shader: p.shader,
          texture: p.texture,
        })
      ),
    appendChild(container: PIXI.ParticleContainer, child) {
      const particle = asParticle(child, classes.Particle);
      container.removeParticle(particle);
      container.addParticle(particle);
      particleParents.set(particle, container);
    },
    insertBefore(container: PIXI.ParticleContainer, child, before) {
      const particle = asParticle(child, classes.Particle);
      container.removeParticle(particle);
      const index = container.particleChildren.indexOf(before as PIXI.Particle);
      if (index === -1) throw new Error("`ParticleContainer` cannot insert a `Particle` before one it does not hold.");
      container.addParticleAt(particle, index);
      particleParents.set(particle, container);
    },
    removeChild(container: PIXI.ParticleContainer, child) {
      container.removeParticle(child as PIXI.Particle);
      particleParents.delete(child as PIXI.Particle);
    },
  }),
  PerspectiveMesh: Ctor => ({
    create: p =>
      new Ctor(
        defined({
          texture: p.texture,
          verticesX: p.verticesX,
          verticesY: p.verticesY,
          x0: p.x0,
          x1: p.x1,
          x2: p.x2,
          x3: p.x3,
          y0: p.y0,
          y1: p.y1,
          y2: p.y2,
          y3: p.y3,
        })
      ),
    // `build` resets the positions that the corners project, so a rebuild sets the corners again.
    applyProps(mesh: PIXI.PerspectiveMesh, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      const rebuild = changed(oldProps, newProps, ["verticesX", "verticesY"]);
      if (rebuild) rebuildPlane(mesh.geometry, newProps);
      if (rebuild || changed(oldProps, newProps, CORNERS)) {
        const defaults = Ctor.defaultOptions as unknown as Record<string, number>;
        const [x0, y0, x1, y1, x2, y2, x3, y3] = CORNERS.map(key => newProps[key] ?? defaults[key]);
        mesh.setCorners(x0, y0, x1, y1, x2, y2, x3, y3);
      }
    },
  }),
  RenderContainer: Ctor => ({
    create: p => new Ctor(defined({ addBounds: p.addBounds, containsPoint: p.containsPoint, render: p.render })),
  }),
  RenderLayer: Ctor => ({ create: () => new Ctor() }),
  Sprite: Ctor => ({ create: p => new Ctor(p.texture) }),
  Text: Ctor => ({ create: p => new Ctor(defined({ style: p.style, text: p.text })) }),
  TilingSprite: Ctor => ({
    create: p => new Ctor(defined({ height: p.height, texture: p.texture, width: p.width })),
  }),
};
