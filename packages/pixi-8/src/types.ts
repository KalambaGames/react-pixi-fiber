import type * as PIXI from "pixi.js";
import type { Props } from "react-pixi-fiber";
import type { allClasses } from "./all";

// Importing this package fills the core's augmentable interfaces with the PixiJS 8 classes.
declare module "react-pixi-fiber" {
  interface PixiInstances {
    AlphaFilter: PIXI.AlphaFilter;
    AnimatedSprite: PIXI.AnimatedSprite;
    BitmapText: PIXI.BitmapText;
    BlurFilter: PIXI.BlurFilter;
    ColorMatrixFilter: PIXI.ColorMatrixFilter;
    Container: PIXI.Container;
    DOMContainer: PIXI.DOMContainer;
    DisplacementFilter: PIXI.DisplacementFilter;
    Graphics: PIXI.Graphics;
    HTMLText: PIXI.HTMLText;
    Mesh: PIXI.Mesh;
    MeshPlane: PIXI.MeshPlane;
    MeshRope: PIXI.MeshRope;
    MeshSimple: PIXI.MeshSimple;
    NineSliceSprite: PIXI.NineSliceSprite;
    NoiseFilter: PIXI.NoiseFilter;
    Particle: PIXI.Particle;
    ParticleContainer: PIXI.ParticleContainer;
    PerspectiveMesh: PIXI.PerspectiveMesh;
    RenderContainer: PIXI.RenderContainer;
    RenderLayer: PIXI.RenderLayer;
    Sprite: PIXI.Sprite;
    Text: PIXI.Text;
    TilingSprite: PIXI.TilingSprite;
  }
  interface PixiTypes {
    Application: PIXI.Application;
    ApplicationOptions: Partial<PIXI.ApplicationOptions>;
    Point: PIXI.Point | PIXI.ObservablePoint | PIXI.PointData;
    // The options type of a class declares what its setters accept, including what plugins add. The first pair the
    // instance extends wins, so a subclass comes before its parent.
    SetterTypes: [
      [PIXI.AnimatedSprite, PIXI.AnimatedSpriteOptions],
      [PIXI.TilingSprite, PIXI.TilingSpriteOptions],
      [PIXI.NineSliceSprite, PIXI.NineSliceSpriteOptions],
      [PIXI.Sprite, PIXI.SpriteOptions],
      [PIXI.HTMLText, PIXI.HTMLTextOptions],
      [PIXI.BitmapText, PIXI.TextOptions],
      [PIXI.Text, PIXI.TextOptions],
      [PIXI.PerspectiveMesh, PIXI.PerspectivePlaneOptions],
      [PIXI.MeshPlane, PIXI.MeshPlaneOptions],
      [PIXI.MeshRope, PIXI.MeshRopeOptions],
      [PIXI.MeshSimple, PIXI.SimpleMeshOptions],
      [PIXI.Mesh, PIXI.MeshOptions],
      // `GraphicsOptions` does not declare the fill and stroke setters.
      [PIXI.Graphics, PIXI.GraphicsOptions & { fillStyle: PIXI.FillInput; strokeStyle: PIXI.StrokeStyle }],
      [PIXI.Particle, PIXI.ParticleOptions],
      [PIXI.ParticleContainer, PIXI.ParticleContainerOptions],
      [PIXI.DOMContainer, PIXI.DOMContainerOptions],
      [PIXI.RenderContainer, PIXI.RenderContainerOptions],
      [PIXI.Container, PIXI.ContainerOptions],
      [PIXI.AlphaFilter, PIXI.AlphaFilterOptions],
      [PIXI.BlurFilter, PIXI.BlurFilterOptions],
      [PIXI.DisplacementFilter, PIXI.DisplacementFilterOptions],
      [PIXI.NoiseFilter, PIXI.NoiseFilterOptions],
    ];
  }
}

export type Pixi8Classes = typeof allClasses;

export type DOMContainerProps = Props<PIXI.DOMContainer>;
export type HTMLTextProps = Props<PIXI.HTMLText>;
export type ParticleProps = Omit<Props<PIXI.Particle>, "texture"> & { texture: PIXI.Texture };
export type ParticleContainerProps = Props<PIXI.ParticleContainer> & {
  // Constructor argument that is not a property on the instance
  dynamicProperties?: PIXI.ParticleContainerOptions["dynamicProperties"];
};
export type PerspectiveMeshProps = Props<PIXI.PerspectiveMesh> & {
  // Constructor arguments that are not properties on the instance
  verticesX?: number;
  verticesY?: number;
  x0?: number;
  x1?: number;
  x2?: number;
  x3?: number;
  y0?: number;
  y1?: number;
  y2?: number;
  y3?: number;
};
export type RenderContainerProps = Props<PIXI.RenderContainer> & {
  // Constructor arguments that are not properties on the instance
  addBounds?: PIXI.RenderContainerOptions["addBounds"];
  containsPoint?: PIXI.RenderContainerOptions["containsPoint"];
  render?: PIXI.RenderContainerOptions["render"];
};
export type RenderLayerProps = Props<PIXI.RenderLayer>;
