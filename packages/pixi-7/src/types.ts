import type * as PIXI from "pixi.js";
import type { FilterProps, Props } from "react-pixi-fiber";

// Importing this package fills the core's augmentable interfaces with the PixiJS 7 classes.
declare module "react-pixi-fiber" {
  interface PixiInstances {
    AlphaFilter: PIXI.AlphaFilter;
    AnimatedSprite: PIXI.AnimatedSprite;
    BitmapText: PIXI.BitmapText;
    BlurFilter: PIXI.BlurFilter;
    ColorMatrixFilter: PIXI.ColorMatrixFilter;
    Container: PIXI.Container;
    DisplacementFilter: PIXI.DisplacementFilter;
    FXAAFilter: PIXI.FXAAFilter;
    Graphics: PIXI.Graphics;
    HTMLText: PIXI.HTMLText;
    Mesh: PIXI.Mesh;
    MeshPlane: PIXI.SimplePlane;
    MeshRope: PIXI.SimpleRope;
    MeshSimple: PIXI.SimpleMesh;
    NineSlicePlane: PIXI.NineSlicePlane;
    NineSliceSprite: PIXI.NineSlicePlane;
    NoiseFilter: PIXI.NoiseFilter;
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
    ApplicationOptions: Partial<PIXI.IApplicationOptions>;
    DestroyOptions: NonNullable<Parameters<PIXI.Container["destroy"]>[0]>;
    Point: PIXI.Point | PIXI.ObservablePoint | PIXI.IPointData;
    // The setters that accept more than their getters return. `HTMLText` comes first: the first pair the instance
    // extends wins.
    SetterTypes: [
      [PIXI.HTMLText, { style: PIXI.HTMLTextStyle | PIXI.TextStyle | Partial<PIXI.ITextStyle> }],
      [PIXI.Text, { style: PIXI.TextStyle | Partial<PIXI.ITextStyle>; text: string | number }],
    ];
  }
}

export type FXAAFilterProps = FilterProps<PIXI.FXAAFilter>;
export type HTMLTextProps = Props<PIXI.HTMLText>;
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
  // Constructor arguments. A change after mount rebuilds the geometry.
  points?: PIXI.IPoint[];
  textureScale?: number;
};
// `Text` props, with `style` widened to the setter type by `SetterTypes`.
export type TextProps = Props<PIXI.Text>;
