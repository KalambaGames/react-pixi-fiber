import * as PIXI from "pixi.js";
import type { PixiAdapter, PixiComponent } from "react-pixi-fiber";
import { behaviors } from "./behaviors";
import { properties } from "./properties";
import type { FXAAFilterProps, NineSlicePlaneProps, SimpleMeshProps, SimplePlaneProps, SimpleRopeProps } from "./types";
export * from "./types";

// A tag is a string at runtime and a component in the type system, like the core tags.
export const FXAAFilter = "FXAAFilter" as unknown as PixiComponent<
  FXAAFilterProps,
  InstanceType<typeof PIXI.filters.FXAAFilter>
>;
export type FXAAFilter = FXAAFilterProps;
export const NineSlicePlane = "NineSlicePlane" as unknown as PixiComponent<NineSlicePlaneProps, PIXI.NineSlicePlane>;
export const SimpleMesh = "SimpleMesh" as unknown as PixiComponent<SimpleMeshProps, PIXI.SimpleMesh>;
export const SimplePlane = "SimplePlane" as unknown as PixiComponent<SimplePlaneProps, PIXI.SimplePlane>;
export const SimpleRope = "SimpleRope" as unknown as PixiComponent<SimpleRopeProps, PIXI.SimpleRope>;

export interface Pixi6Options {
  /**
   * Default props per tag, like React's `defaultProps`, keyed by the tag as written in JSX. A prop that is missing or
   * `undefined` when an instance is created gets its default before `create` runs; a prop that is later removed or
   * set to `undefined` returns to it. An explicit `null` is not replaced.
   */
  defaults?: Record<string, Record<string, unknown>>;
}

export default function pixi6({ defaults }: Pixi6Options = {}): PixiAdapter {
  return {
    behaviors,
    defaults,
    properties,
    isPoint: (value): value is PIXI.IPointData => value instanceof PIXI.Point || value instanceof PIXI.ObservablePoint,
    copyPoint: (target, value) => {
      (target as PIXI.Point).copyFrom(value);
    },
    createApplication: options => new PIXI.Application(options as PIXI.IApplicationOptions),
    destroyApplication: (app: PIXI.Application, removeView, stageOptions) => {
      // Destroying a WebGL renderer loses its canvas's context for good. A canvas still in the document may already
      // hold the next application on the same context (StrictMode's second mount, a recreate on `options.view`).
      const extensions = (app.renderer as any).context?.extensions;
      if (extensions && (app.view as HTMLCanvasElement).isConnected) extensions.loseContext = null;
      app.destroy(removeView, stageOptions as any);
    },
    isApplication: value => value instanceof PIXI.Application,
    // PixiJS 6 `Filter.destroy` frees no GPU resource. Below 6.5.7 it also leaves the renderer's bound shader without
    // its uniforms: the next frame then throws. So the adapter releases a filter without `destroy`.
    releaseFilter() {},
  };
}
