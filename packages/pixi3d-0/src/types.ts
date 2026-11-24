import type * as PIXI3D from "@pixi/3d";
import type * as PIXI from "pixi.js";
import type { Props } from "react-pixi-fiber";

// Importing this package fills the core's augmentable interfaces with the `@pixi/3d` classes.
declare module "react-pixi-fiber" {
  interface PixiInstances {
    Container3D: PIXI3D.Container3D;
    Mesh3D: PIXI3D.Mesh3D;
    View3D: PIXI3D.View3D;
  }
  interface PixiTypes {
    // What counts as a 3D node.
    Node3D: PIXI3D.Container3D;
    // [type a prop holds, what the prop accepts], most specific first.
    PointLikes3D: [
      [PIXI3D.ObservableQuaternion, PIXI3D.QuaternionData | [number, number, number, number]],
      [PIXI3D.ObservableVector3, PIXI3D.PointData3D | [number, number, number] | number | string],
      // `Sprite3D.anchor` is a 2D point on a 3D node.
      [PIXI.ObservablePoint, PIXI.PointData | [number, number] | number | string],
    ];
    // As `SetterTypes`, for the 3D classes. A subclass comes before its parent.
    SetterTypes3D: [[PIXI3D.Mesh3D, PIXI3D.Mesh3DOptions], [PIXI3D.Container3D, PIXI3D.Container3DOptions]];
  }
}

export type Container3DProps = Props<PIXI3D.Container3D>;
export type Mesh3DProps = Props<PIXI3D.Mesh3D>;
export type View3DProps = Props<PIXI3D.View3D>;
