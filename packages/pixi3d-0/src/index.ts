import type * as PIXI3D from "@pixi/3d";
import { Container3D as Container3DClass } from "@pixi/3d";
import type { FPSCamera as PixiFPSCamera, OrbitCamera as PixiOrbitCamera } from "@pixi/3d/extras";

import type { Pixi3dAdapter, PixiComponent } from "react-pixi-fiber";

import { behaviors } from "./behaviors";
import type { ControllerNode } from "./controllers";
import { controllerBehavior } from "./controllers";
import { clonePoint, isPoint, setPoint } from "./points";
import { properties } from "./properties";
import type {
  AmbientLightProps,
  BatchedMesh3DProps,
  Camera3DProps,
  Container3DProps,
  DirectionalLightProps,
  FPSCameraProps,
  Mesh3DProps,
  Model3DProps,
  OrbitCameraProps,
  ParticleContainer3DProps,
  PointLightProps,
  SpotLightProps,
  Sprite3DProps,
  View3DProps,
} from "./types";

export type { ControllerNode } from "./controllers";
export * from "./types";

// A tag is a string at runtime and a component in the type system, like the core tags.
export const AmbientLight = "AmbientLight" as unknown as PixiComponent<AmbientLightProps, PIXI3D.AmbientLight>;
export const BatchedMesh3D = "BatchedMesh3D" as unknown as PixiComponent<BatchedMesh3DProps, PIXI3D.BatchedMesh3D>;
export const Camera3D = "Camera3D" as unknown as PixiComponent<Camera3DProps, PIXI3D.Camera3D>;
export const Container3D = "Container3D" as unknown as PixiComponent<Container3DProps, PIXI3D.Container3D>;
export const DirectionalLight = "DirectionalLight" as unknown as PixiComponent<
  DirectionalLightProps,
  PIXI3D.DirectionalLight
>;
export const FPSCamera = "FPSCamera" as unknown as PixiComponent<FPSCameraProps, ControllerNode<PixiFPSCamera>>;
export const Mesh3D = "Mesh3D" as unknown as PixiComponent<Mesh3DProps, PIXI3D.Mesh3D>;
export const Model3D = "Model3D" as unknown as PixiComponent<Model3DProps, PIXI3D.Model3D>;
export const OrbitCamera = "OrbitCamera" as unknown as PixiComponent<OrbitCameraProps, ControllerNode<PixiOrbitCamera>>;
export const ParticleContainer3D = "ParticleContainer3D" as unknown as PixiComponent<
  ParticleContainer3DProps,
  PIXI3D.ParticleContainer3D
>;
export const PointLight = "PointLight" as unknown as PixiComponent<PointLightProps, PIXI3D.PointLight>;
export const SpotLight = "SpotLight" as unknown as PixiComponent<SpotLightProps, PIXI3D.SpotLight>;
export const Sprite3D = "Sprite3D" as unknown as PixiComponent<Sprite3DProps, PIXI3D.Sprite3D>;
export const View3D = "View3D" as unknown as PixiComponent<View3DProps, PIXI3D.View3D>;

export interface Pixi3d0Options {
  /**
   * Default props per tag, like React's `defaultProps`, keyed by the tag as written in JSX. A prop that is missing or
   * `undefined` when an instance is created gets its default before `create` runs. A prop that is later removed or
   * set to `undefined` returns to it. An explicit `null` is not replaced.
   */
  defaults?: Record<string, Record<string, unknown>>;
  // The camera controllers from `@pixi/3d/extras` that the app renders.
  extras?: { FPSCamera?: typeof PixiFPSCamera; OrbitCamera?: typeof PixiOrbitCamera };
}

export default function pixi3d0(options: Pixi3d0Options = {}): Pixi3dAdapter {
  return {
    behaviors: {
      ...behaviors,
      FPSCamera: controllerBehavior("FPSCamera", options.extras?.FPSCamera),
      OrbitCamera: controllerBehavior("OrbitCamera", options.extras?.OrbitCamera),
    },
    defaults: options.defaults,
    properties,
    isNode: value => value instanceof Container3DClass,
    isPoint,
    clonePoint,
    setPoint,
  };
}
