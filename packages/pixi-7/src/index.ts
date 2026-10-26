import * as PIXI from "pixi.js";
import type { PixiAdapter, PixiComponent } from "react-pixi-fiber";
import { components } from "./components";
import { properties } from "./properties";
import type {
  FXAAFilterProps,
  HTMLTextProps,
  NineSlicePlaneProps,
  SimpleMeshProps,
  SimplePlaneProps,
  SimpleRopeProps,
} from "./types";
export * from "./types";

// A tag is a string at runtime and a component in the type system, like the core tags.
export const FXAAFilter = "FXAAFilter" as unknown as PixiComponent<FXAAFilterProps, PIXI.FXAAFilter>;
export type FXAAFilter = FXAAFilterProps;
export const HTMLText = "HTMLText" as unknown as PixiComponent<HTMLTextProps, PIXI.HTMLText>;
export const NineSlicePlane = "NineSlicePlane" as unknown as PixiComponent<NineSlicePlaneProps, PIXI.NineSlicePlane>;
export const SimpleMesh = "SimpleMesh" as unknown as PixiComponent<SimpleMeshProps, PIXI.SimpleMesh>;
export const SimplePlane = "SimplePlane" as unknown as PixiComponent<SimplePlaneProps, PIXI.SimplePlane>;
export const SimpleRope = "SimpleRope" as unknown as PixiComponent<SimpleRopeProps, PIXI.SimpleRope>;

export interface Pixi7Options {
  // The default export of `@react-pixi-fiber/pixi-7/compat/pixi6`.
  compat?: PixiAdapter["translateProps"];
  /**
   * Default props per tag, like React's `defaultProps`, keyed by the tag as written in JSX. A prop that is missing or
   * `undefined` when an instance is created gets its default before `create` runs; a prop that is later removed or
   * set to `undefined` returns to it. An explicit `null` is not replaced.
   */
  defaults?: Record<string, Record<string, unknown>>;
}

// PixiJS 6 props that PixiJS 7 sets and never reads. Only the development build lists them, to warn.
const LEGACY_PROPS = [
  "buttonMode",
  "click",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "mouseupoutside",
  "pointercancel",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointertap",
  "pointerup",
  "pointerupoutside",
  "rightclick",
  "rightdown",
  "rightup",
  "rightupoutside",
  "tap",
  "touchcancel",
  "touchend",
  "touchendoutside",
  "touchmove",
  "touchstart",
];
const warnedLegacyProps: Record<string, boolean> = {};

// Not the compat module's `warning`: a module both entries import would become a shared chunk.
function warnLegacyProps(type: string, props: Record<string, unknown>): Record<string, unknown> {
  for (const name of LEGACY_PROPS) {
    if (Object.prototype.hasOwnProperty.call(props, name) && !warnedLegacyProps[name]) {
      warnedLegacyProps[name] = true;
      console.error(
        `Warning: \`${name}\` on \`<${type} />\` is a PixiJS 6 prop that PixiJS 7 ignores. Use the PixiJS 7 prop, or pass the default export of \`@react-pixi-fiber/pixi-7/compat/pixi6\` as \`pixi7({ compat })\`.`
      );
    }
  }
  return props;
}

export default function pixi7({ compat, defaults }: Pixi7Options = {}): PixiAdapter {
  const adapter: PixiAdapter = {
    components,
    defaults,
    properties,
    isPoint: (value): value is PIXI.IPointData => value instanceof PIXI.Point || value instanceof PIXI.ObservablePoint,
    copyPoint: (target, value) => {
      (target as PIXI.Point).copyFrom(value);
    },
    createApplication: options => new PIXI.Application(options as Partial<PIXI.IApplicationOptions>),
    destroyApplication: (app: PIXI.Application, removeView, stageOptions) => {
      // Destroying a WebGL renderer loses its canvas's context for good. A canvas still in the document may already
      // hold the next application on the same context (StrictMode's second mount, a recreate on `options.view`).
      const renderer = app.renderer as any;
      if (renderer.type === PIXI.RENDERER_TYPE.WEBGL && (app.view as HTMLCanvasElement).isConnected) {
        renderer.context.extensions.loseContext = null;
      }
      app.destroy(removeView, stageOptions as any);
    },
    isApplication: value => value instanceof PIXI.Application,
  };
  if (compat !== undefined) {
    if (typeof compat !== "function") {
      throw new Error(
        `\`pixi7({ compat })\` got ${JSON.stringify(compat)}. Pass the default export of \`@react-pixi-fiber/pixi-7/compat/pixi6\`, or leave \`compat\` out.`
      );
    }
    adapter.translateProps = compat;
  } else if (__DEV__) {
    adapter.translateProps = warnLegacyProps;
  }
  return adapter;
}
