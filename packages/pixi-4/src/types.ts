import type * as PIXI from "pixi.js";
import type { FilterProps, InteractionEventTypes, Props } from "react-pixi-fiber";

// Importing this package fills the core's augmentable interfaces with the PixiJS 4 classes.
declare module "react-pixi-fiber" {
  interface PixiExtraProps extends InteractiveComponent {}
  interface PixiInstances {
    AlphaFilter: PIXI.filters.AlphaFilter;
    AnimatedSprite: PIXI.extras.AnimatedSprite;
    BitmapText: PIXI.extras.BitmapText;
    BlurFilter: PIXI.filters.BlurFilter;
    ColorMatrixFilter: PIXI.filters.ColorMatrixFilter;
    Container: PIXI.Container;
    DisplacementFilter: PIXI.filters.DisplacementFilter;
    FXAAFilter: PIXI.filters.FXAAFilter;
    Graphics: PIXI.Graphics;
    Mesh: PIXI.mesh.Mesh;
    MeshPlane: PIXI.mesh.Plane;
    MeshRope: PIXI.mesh.Rope;
    MeshSimple: PIXI.mesh.Mesh;
    NineSlicePlane: PIXI.mesh.NineSlicePlane;
    NineSliceSprite: PIXI.mesh.NineSlicePlane;
    NoiseFilter: PIXI.filters.NoiseFilter;
    ParticleContainer: PIXI.particles.ParticleContainer;
    Plane: PIXI.mesh.Plane;
    Rope: PIXI.mesh.Rope;
    Sprite: PIXI.Sprite;
    Text: PIXI.Text;
    TilingSprite: PIXI.extras.TilingSprite;
  }
  interface PixiTypes {
    Application: PIXI.Application;
    ApplicationOptions: PIXI.ApplicationOptions;
    DestroyOptions: NonNullable<Parameters<PIXI.Container["destroy"]>[0]>;
    InteractionEvent: PIXI.interaction.InteractionEvent;
    Point: PIXI.Point | PIXI.ObservablePoint | PIXI.PointLike;
  }
}

export type FXAAFilterProps = FilterProps<PIXI.filters.FXAAFilter>;
export type InteractionCompatibility = Exclude<keyof typeof PIXI.interaction, number | symbol>;
// PixiJS 4 has no `PIXI.InteractionEvent` value, so its key union is `string`.
export type InteractionEventCompatibility = string;
export type InteractiveComponent = {
  [P in InteractionEventTypes]?: (event: PIXI.interaction.InteractionEvent) => void;
};
export type NineSlicePlaneProps = Props<PIXI.mesh.NineSlicePlane>;
export type PixiTypeFallback<T, U> = T extends PIXI.DisplayObject ? T : U;
export type PlaneProps = Props<PIXI.mesh.Plane> & {
  // Constructor arguments that are not properties on the instance
  verticesX?: number;
  verticesY?: number;
};
export type RopeProps = Props<PIXI.mesh.Rope>;
// `Text` props with `style` narrowed to the PixiJS 4 text style types.
export type TextProps = Omit<Props<PIXI.Text>, "style"> & {
  style?: PIXI.TextStyle | PIXI.TextStyleOptions;
};
