import type * as PIXI from "pixi.js";
import type { Behavior } from "react-pixi-fiber";
import type { Pixi8Components } from "./types";

export type Pixi8Tag = Exclude<keyof Pixi8Components, "Application">;
export type Factory<K extends Pixi8Tag> = (Ctor: Pixi8Components[K], components: Partial<Pixi8Components>) => Behavior;

// PixiJS 8 constructors spread their options over the class defaults, so a key set to `undefined` would win over the
// default. Only the props that are set are passed.
function defined<T extends Record<string, unknown>>(options: T): T {
  const out = {} as T;
  for (const key in options) if (options[key] !== undefined) out[key] = options[key];
  return out;
}

// A particle has no parent pointer, so a prop change finds the container to `update()` here.
const particleParents = new WeakMap<PIXI.Particle, PIXI.ParticleContainer>();

function asParticle(child: unknown, Particle: Pixi8Components["Particle"] | undefined): PIXI.Particle {
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
  AnimatedSprite: Ctor => ({ create: p => new Ctor(p.textures, p.autoUpdate) }),
  BitmapText: Ctor => ({ create: p => new Ctor(defined({ style: p.style, text: p.text })) }),
  Container: Ctor => ({ create: () => new Ctor() }),
  DOMContainer: Ctor => ({ create: p => new Ctor(defined({ anchor: p.anchor, element: p.element })) }),
  Graphics: Ctor => ({ create: p => new Ctor(p.context) }),
  HTMLText: Ctor => ({ create: p => new Ctor(defined({ style: p.style, text: p.text })) }),
  Mesh: Ctor => ({
    create: p => new Ctor(defined({ geometry: p.geometry, shader: p.shader, state: p.state, texture: p.texture })),
  }),
  MeshPlane: Ctor => ({
    create: p => new Ctor(defined({ texture: p.texture, verticesX: p.verticesX, verticesY: p.verticesY })),
  }),
  MeshRope: Ctor => ({
    create: p => new Ctor(defined({ points: p.points, texture: p.texture, textureScale: p.textureScale })),
  }),
  MeshSimple: Ctor => ({
    create: p =>
      new Ctor(
        defined({ indices: p.indices, texture: p.texture, topology: p.topology, uvs: p.uvs, vertices: p.vertices })
      ),
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
  ParticleContainer: (Ctor, components) => ({
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
      const particle = asParticle(child, components.Particle);
      container.removeParticle(particle);
      container.addParticle(particle);
      particleParents.set(particle, container);
    },
    insertBefore(container: PIXI.ParticleContainer, child, before) {
      const particle = asParticle(child, components.Particle);
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
