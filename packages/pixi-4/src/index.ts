import * as PIXI from "pixi.js";
import type { PixiAdapter, PixiComponent } from "react-pixi-fiber";
import { behaviors } from "./behaviors";
import { properties } from "./properties";
import type { FXAAFilterProps, NineSlicePlaneProps, PlaneProps, RopeProps } from "./types";
export * from "./types";

// A tag is a string at runtime and a component in the type system, like the core tags.
export const FXAAFilter = "FXAAFilter" as unknown as PixiComponent<FXAAFilterProps, PIXI.filters.FXAAFilter>;
export type FXAAFilter = FXAAFilterProps;
export const NineSlicePlane = "NineSlicePlane" as unknown as PixiComponent<
  NineSlicePlaneProps,
  PIXI.mesh.NineSlicePlane
>;
export const Plane = "Plane" as unknown as PixiComponent<PlaneProps, PIXI.mesh.Plane>;
export const Rope = "Rope" as unknown as PixiComponent<RopeProps, PIXI.mesh.Rope>;

export interface Pixi4Options {
  /**
   * Default props per tag, like React's `defaultProps`, keyed by the tag as written in JSX. A prop that is missing or
   * `undefined` when an instance is created gets its default before `create` runs; a prop that is later removed or
   * set to `undefined` returns to it. An explicit `null` is not replaced.
   */
  defaults?: Record<string, Record<string, unknown>>;
}

export default function pixi4({ defaults }: Pixi4Options = {}): PixiAdapter {
  return {
    behaviors,
    defaults,
    properties,
    isPoint: (value): value is PIXI.PointLike => value instanceof PIXI.Point || value instanceof PIXI.ObservablePoint,
    copyPoint: (target, value) => {
      (target as PIXI.Point).copy(value as PIXI.PointLike);
    },
    createApplication: options => new PIXI.Application(options as PIXI.ApplicationOptions),
    destroyApplication: (app: PIXI.Application, removeView, stageOptions) => {
      // Destroying a WebGL renderer loses its canvas's context for good. A canvas still in the document may already
      // hold the next application on the same context (StrictMode's second mount, a recreate on `options.view`).
      // PixiJS 4 reads the extension from that shared context, so hide it from this one destroy.
      const gl = (app.view as HTMLCanvasElement).isConnected ? (app.renderer as any).gl : undefined;
      if (!gl) {
        app.destroy(removeView, stageOptions as any);
        return;
      }
      const own = Object.prototype.hasOwnProperty.call(gl, "getExtension");
      const getExtension = gl.getExtension;
      gl.getExtension = (name: string) => (name === "WEBGL_lose_context" ? null : getExtension.call(gl, name));
      try {
        app.destroy(removeView, stageOptions as any);
      } finally {
        if (own) gl.getExtension = getExtension;
        else delete gl.getExtension;
      }
    },
    isApplication: value => value instanceof PIXI.Application,
  };
}
