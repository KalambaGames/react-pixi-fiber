import type * as PIXI3D from "@pixi/3d";
import type { FPSCameraOptions, OrbitCameraOptions } from "@pixi/3d/extras";
import type * as PIXI from "pixi.js";
import type { Props } from "react-pixi-fiber";
import type { CONSTRUCTOR_ONLY } from "./behaviors";

// Importing this package fills the core's augmentable interfaces with the `@pixi/3d` classes.
declare module "react-pixi-fiber" {
  interface PixiInstances {
    AmbientLight: PIXI3D.AmbientLight;
    BatchedMesh3D: PIXI3D.BatchedMesh3D;
    Camera3D: PIXI3D.Camera3D;
    Container3D: PIXI3D.Container3D;
    DirectionalLight: PIXI3D.DirectionalLight;
    Mesh3D: PIXI3D.Mesh3D;
    Model3D: PIXI3D.Model3D;
    ParticleContainer3D: PIXI3D.ParticleContainer3D;
    PointLight: PIXI3D.PointLight;
    SpotLight: PIXI3D.SpotLight;
    Sprite3D: PIXI3D.Sprite3D;
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
    SetterTypes3D: [
      [PIXI3D.AmbientLight, PIXI3D.AmbientLightOptions],
      [PIXI3D.DirectionalLight, PIXI3D.DirectionalLightOptions],
      [PIXI3D.Model3D, PIXI3D.Model3DOptions],
      [PIXI3D.PointLight, PIXI3D.PointLightOptions],
      [PIXI3D.SpotLight, PIXI3D.SpotLightOptions],
      [PIXI3D.Sprite3D, PIXI3D.Sprite3DOptions],
    ];
  }
}

// The constructor-only props take the option types, which can differ from a read-only member of the same name. A
// change after mount warns. Give the element a new `key` to change one.
type ConstructorOnly<Tag extends keyof typeof CONSTRUCTOR_ONLY> = (typeof CONSTRUCTOR_ONLY)[Tag][number];
type WithOptions<I, O, Tag extends keyof typeof CONSTRUCTOR_ONLY> = Omit<Props<I>, ConstructorOnly<Tag>> &
  Pick<O, ConstructorOnly<Tag> & keyof O>;

// The options of a controller without `view`, the view that holds the element. A vector option takes every vector form.
type ControllerProps<O> = {
  [K in Exclude<keyof O, "view">]?: [NonNullable<O[K]>] extends [PIXI3D.PointData3D]
    ? PIXI3D.PointData3D | [number, number, number] | number | string
    : O[K];
};

export type AmbientLightProps = Props<PIXI3D.AmbientLight>;
export type BatchedMesh3DProps = WithOptions<PIXI3D.BatchedMesh3D, PIXI3D.BatchedMesh3DOptions, "BatchedMesh3D">;
// `active` makes the camera the camera of its view, at any depth.
export type Camera3DProps = Props<PIXI3D.Camera3D> & { active?: boolean };
export type Container3DProps = Props<PIXI3D.Container3D>;
export type DirectionalLightProps = Props<PIXI3D.DirectionalLight>;
// `position` sets the camera at construction only. Set `position` of the camera.
export type FPSCameraProps = ControllerProps<Omit<FPSCameraOptions, "position">>;
export type Mesh3DProps = WithOptions<PIXI3D.Mesh3D, PIXI3D.Mesh3DOptions, "Mesh3D">;
export type Model3DProps = WithOptions<PIXI3D.Model3D, PIXI3D.Model3DOptions, "Model3D">;
export type OrbitCameraProps = ControllerProps<OrbitCameraOptions>;
export type ParticleContainer3DProps = WithOptions<
  PIXI3D.ParticleContainer3D,
  PIXI3D.ParticleContainer3DOptions,
  "ParticleContainer3D"
>;
export type PointLightProps = Props<PIXI3D.PointLight>;
export type SpotLightProps = Props<PIXI3D.SpotLight>;
export type Sprite3DProps = Props<PIXI3D.Sprite3D>;
// `camera` and `root` are not props: the children of the element are the scene.
export type View3DProps = Omit<WithOptions<PIXI3D.View3D, PIXI3D.View3DOptions, "View3D">, "camera" | "root">;
