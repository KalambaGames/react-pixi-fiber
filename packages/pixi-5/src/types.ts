import type * as PIXI from "pixi.js";
import type { FilterProps, InteractionEventTypes, Props } from "react-pixi-fiber";

// Importing this package fills the core's augmentable interfaces with the PixiJS 5 classes.
declare module "react-pixi-fiber" {
  interface PixiExtraProps extends InteractiveComponent {}
  interface PixiInstances {
    AlphaFilter: PIXI.filters.AlphaFilter;
    AnimatedSprite: PIXI.AnimatedSprite;
    BitmapText: PIXI.BitmapText;
    BlurFilter: PIXI.filters.BlurFilter;
    ColorMatrixFilter: PIXI.filters.ColorMatrixFilter;
    Container: PIXI.Container;
    DisplacementFilter: PIXI.filters.DisplacementFilter;
    FXAAFilter: PIXI.filters.FXAAFilter;
    Graphics: PIXI.Graphics;
    Mesh: PIXI.Mesh;
    MeshPlane: PIXI.SimplePlane;
    MeshRope: PIXI.SimpleRope;
    MeshSimple: PIXI.SimpleMesh;
    NineSlicePlane: PIXI.NineSlicePlane;
    NineSliceSprite: PIXI.NineSlicePlane;
    NoiseFilter: PIXI.filters.NoiseFilter;
    ParticleContainer: PIXI.ParticleContainer;
    SimpleMesh: PIXI.SimpleMesh;
    SimplePlane: PIXI.SimplePlane;
    SimpleRope: PIXI.SimpleRope;
    Sprite: PIXI.Sprite;
    Text: PIXI.Text;
    TilingSprite: PIXI.TilingSprite;
  }
  interface PixiTypes {
    Application: PIXI.Application;
    ApplicationOptions: NonNullable<ConstructorParameters<typeof PIXI.Application>[0]>;
    // The pixi.js 5 typings of `Container.destroy` omit the boolean that it accepts.
    DestroyOptions: boolean | NonNullable<Parameters<PIXI.Container["destroy"]>[0]>;
    InteractionEvent: PIXI.InteractionEvent;
    Point: PIXI.Point | PIXI.ObservablePoint | PIXI.IPointData;
  }
}

export type FXAAFilterProps = FilterProps<PIXI.filters.FXAAFilter>;
// PixiJS 5 has no `PIXI.interaction` namespace, so its key union is `string`.
export type InteractionCompatibility = string;
export type InteractionEventCompatibility = Exclude<keyof typeof PIXI.InteractionEvent, number | symbol>;
export type InteractiveComponent = { [P in InteractionEventTypes]?: (event: PIXI.InteractionEvent) => void };
export type NineSlicePlaneProps = Props<PIXI.NineSlicePlane>;
export type PixiTypeFallback<T, U> = T extends PIXI.DisplayObject ? T : U;
export type SimpleMeshProps = Props<PIXI.SimpleMesh> & {
  // Constructor arguments. A change after mount goes to the geometry.
  indices?: Uint16Array | number[];
  uvs?: Float32Array | number[];
};
export type SimplePlaneProps = Props<PIXI.SimplePlane> & {
  // Constructor arguments. A change after mount rebuilds the geometry.
  verticesX?: number;
  verticesY?: number;
};
export type SimpleRopeProps = Props<PIXI.SimpleRope> & {
  // Constructor arguments. A change after mount rebuilds the geometry. The constructor needs `points`.
  points: PIXI.IPoint[];
  textureScale?: number;
};
// `Text` props with `style` narrowed to the PixiJS 5 text style types.
export type TextProps = Omit<Props<PIXI.Text>, "style"> & {
  style?: PIXI.TextStyle | ConstructorParameters<typeof PIXI.TextStyle>[0];
};
