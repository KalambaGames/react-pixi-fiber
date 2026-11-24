import type * as PIXI3D from "@pixi/3d";
import { Container3D as Container3DClass } from "@pixi/3d";
import type { FPSCamera, OrbitCamera } from "@pixi/3d/extras";
import type { Pixi3dAdapter, PixiComponent } from "react-pixi-fiber";
import { behaviors } from "./behaviors";
import { clonePoint, isPoint, setPoint } from "./points";
import { properties } from "./properties";
import type { Container3DProps, Mesh3DProps, View3DProps } from "./types";
export * from "./types";

// A tag is a string at runtime and a component in the type system, like the core tags.
export const Container3D = "Container3D" as unknown as PixiComponent<Container3DProps, PIXI3D.Container3D>;
export const Mesh3D = "Mesh3D" as unknown as PixiComponent<Mesh3DProps, PIXI3D.Mesh3D>;
export const View3D = "View3D" as unknown as PixiComponent<View3DProps, PIXI3D.View3D>;

export interface Pixi3d0Options {
  /**
   * Default props per tag, like React's `defaultProps`, keyed by the tag as written in JSX. A prop that is missing or
   * `undefined` when an instance is created gets its default before `create` runs. A prop that is later removed or
   * set to `undefined` returns to it. An explicit `null` is not replaced.
   */
  defaults?: Record<string, Record<string, unknown>>;
  // The camera controllers from `@pixi/3d/extras` that the app renders.
  extras?: { FPSCamera?: typeof FPSCamera; OrbitCamera?: typeof OrbitCamera };
}

export default function pixi3d0(options: Pixi3d0Options = {}): Pixi3dAdapter {
  return {
    behaviors: { ...behaviors },
    defaults: options.defaults,
    properties,
    isNode: value => value instanceof Container3DClass,
    isPoint,
    clonePoint,
    setPoint,
  };
}
