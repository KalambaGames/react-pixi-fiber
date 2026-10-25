import { describe, it, expect } from "vitest";
import * as PIXI from "pixi.js";
import { allComponents } from "../src/all";
import { factories, type Pixi8Tag } from "../src/factories";

const texture = PIXI.Texture.WHITE;
const propsFor: Record<Pixi8Tag, Record<string, unknown>> = {
  AnimatedSprite: { textures: [texture] },
  BitmapText: { style: { fill: 0xff0000 }, text: "t" },
  Container: {},
  DOMContainer: { element: document.createElement("div") },
  Graphics: {},
  HTMLText: { text: "t" },
  Mesh: { geometry: new PIXI.PlaneGeometry({ height: 1, verticesX: 2, verticesY: 2, width: 1 }), texture },
  MeshPlane: { texture, verticesX: 2, verticesY: 2 },
  MeshRope: { points: [new PIXI.Point(0, 0), new PIXI.Point(1, 0)], texture },
  MeshSimple: { texture, vertices: new Float32Array([0, 0, 1, 0, 1, 1]) },
  NineSliceSprite: { bottomHeight: 1, leftWidth: 1, rightWidth: 1, texture, topHeight: 1 },
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
  AnimatedSprite: PIXI.AnimatedSprite,
  BitmapText: PIXI.BitmapText,
  Container: PIXI.Container,
  DOMContainer: PIXI.DOMContainer,
  Graphics: PIXI.Graphics,
  HTMLText: PIXI.HTMLText,
  Mesh: PIXI.Mesh,
  MeshPlane: PIXI.MeshPlane,
  MeshRope: PIXI.MeshRope,
  MeshSimple: PIXI.MeshSimple,
  NineSliceSprite: PIXI.NineSliceSprite,
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
  it("has one factory per tag, the keys of allComponents minus Application", () => {
    expect(Object.keys(factories)).toEqual(Object.keys(allComponents).filter(key => key !== "Application"));
  });
  it("creates every tag with the class it is given", () => {
    for (const tag of Object.keys(classFor) as Pixi8Tag[]) {
      const behavior = factories[tag](allComponents[tag] as never, allComponents);
      expect(behavior.create(propsFor[tag]), tag).toBeInstanceOf(classFor[tag]);
    }
  });
  it("leaves out constructor options that are not set, so the PixiJS defaults apply", () => {
    const mesh = factories
      .PerspectiveMesh(PIXI.PerspectiveMesh, allComponents)
      .create({ texture }) as PIXI.PerspectiveMesh;
    expect(mesh.geometry.positions.every(Number.isFinite)).toBe(true);
    expect((factories.Text(PIXI.Text, allComponents).create({}) as PIXI.Text).text).toBe("");
  });
  it("ParticleContainer throws when it inserts before a particle it does not hold", () => {
    const { create, insertBefore } = factories.ParticleContainer(PIXI.ParticleContainer, allComponents);
    const container = create({});
    expect(() => insertBefore?.(container, new PIXI.Particle(texture), new PIXI.Particle(texture))).toThrow(
      "`ParticleContainer` cannot insert a `Particle` before one it does not hold."
    );
  });
  it("ParticleContainer rejects a child that is not components.Particle", () => {
    const { create, appendChild } = factories.ParticleContainer(PIXI.ParticleContainer, allComponents);
    expect(() => appendChild?.(create({}), new PIXI.Sprite(texture))).toThrow(
      "`ParticleContainer` takes only `Particle` children from `@react-pixi-fiber/pixi-8`, not Scene Objects."
    );
  });
});
