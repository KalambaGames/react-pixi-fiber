import type * as PIXI from "pixi.js";
import { ObservablePoint, Point } from "pixi.js";
import type { Behavior, PixiAdapter, PixiComponent } from "react-pixi-fiber";
import { factories, type Pixi8Tag } from "./factories";
import { properties } from "./properties";
import type {
  DOMContainerProps,
  HTMLTextProps,
  ParticleProps,
  PerspectiveMeshProps,
  Pixi8Components,
  RenderContainerProps,
  RenderLayerProps,
} from "./types";
import { allComponents } from "./all";
export { allComponents };
export * from "./types";

// A tag is a string at runtime and a component in the type system, like the core tags.
export const DOMContainer = "DOMContainer" as unknown as PixiComponent<DOMContainerProps, PIXI.DOMContainer>;
export const HTMLText = "HTMLText" as unknown as PixiComponent<HTMLTextProps, PIXI.HTMLText>;
export const Particle = "Particle" as unknown as PixiComponent<ParticleProps, PIXI.Particle>;
export const PerspectiveMesh = "PerspectiveMesh" as unknown as PixiComponent<
  PerspectiveMeshProps,
  PIXI.PerspectiveMesh
>;
export const RenderContainer = "RenderContainer" as unknown as PixiComponent<
  RenderContainerProps,
  PIXI.RenderContainer
>;
export const RenderLayer = "RenderLayer" as unknown as PixiComponent<RenderLayerProps, PIXI.RenderLayer>;

// The keys come from the factories, not from `allComponents`, so `pixi8WithComponents` references no PixiJS class.
const KNOWN_KEYS = [...Object.keys(factories), "Application"].sort();

function build<K extends Pixi8Tag>(tag: K, Ctor: Pixi8Components[K], components: Partial<Pixi8Components>): Behavior {
  return factories[tag](Ctor, components);
}

// `String` throws for an object with no primitive form, such as a module namespace.
function printValue(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  try {
    return String(value);
  } catch (e) {
    return Object.prototype.toString.call(value);
  }
}

function stub(tag: string): Behavior {
  return {
    create: () => {
      throw new Error(
        `\`${tag}\` is not in \`pixi8WithComponents({ components })\`. Add \`${tag}\` from \`pixi.js\` to it.`
      );
    },
  };
}

export interface Pixi8Options {
  // The default export of `@react-pixi-fiber/pixi-8/compat/pixi6` or `/compat/pixi7`.
  compat?: PixiAdapter["translateProps"];
  /**
   * Default props per tag, like React's `defaultProps`, keyed by the tag as written in JSX. A prop that is missing or
   * `undefined` when an instance is created gets its default before `create` runs; a prop that is later removed or
   * set to `undefined` returns to it. An explicit `null` is not replaced.
   */
  defaults?: Record<string, Record<string, unknown>>;
}

export interface Pixi8WithComponentsOptions extends Pixi8Options {
  /**
   * The PixiJS classes the app renders, keyed by the tag as written in JSX, plus `Application`. A bundler drops every
   * class left out. A tag left out throws when it is first rendered.
   */
  components: Partial<Pixi8Components>;
}

// PixiJS 6 props that PixiJS 8 sets and never reads. Only the development build lists them, to warn.
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
        `Warning: \`${name}\` on \`<${type} />\` is a PixiJS 6 prop that PixiJS 8 ignores. Use the PixiJS 8 prop, or pass the default export of \`@react-pixi-fiber/pixi-8/compat/pixi6\` or \`@react-pixi-fiber/pixi-8/compat/pixi7\` as \`pixi8({ compat })\`.`
      );
    }
  }
  return props;
}

// The adapter with every class in `allComponents`.
export default function pixi8(options: Pixi8Options = {}): PixiAdapter {
  if ((options as Partial<Pixi8WithComponentsOptions> | null)?.components !== undefined) {
    throw new Error(
      "`pixi8` takes no `components`. Pass them to `pixi8WithComponents` from `@react-pixi-fiber/pixi-8`."
    );
  }
  return pixi8WithComponents({ ...options, components: allComponents });
}

export function pixi8WithComponents(options: Pixi8WithComponentsOptions): PixiAdapter {
  // A JavaScript call without options reaches the `components` message, not a destructuring TypeError.
  const { compat, components: given, defaults } = options ?? ({} as Pixi8WithComponentsOptions);
  if (given === null || typeof given !== "object") {
    throw new Error("`pixi8WithComponents` needs `components`. Pass the PixiJS classes the app renders.");
  }
  // A later change to the caller's object changes no tag.
  const components = { ...given };
  for (const key of Object.keys(components)) {
    if (!KNOWN_KEYS.includes(key)) {
      throw new Error(
        `\`pixi8WithComponents({ components })\` got unknown key \`${key}\`. Known keys: ${KNOWN_KEYS.join(", ")}.`
      );
    }
  }
  if (components.ParticleContainer !== undefined && components.Particle === undefined) {
    throw new Error(
      "`ParticleContainer` needs `Particle`. Add `Particle` from `pixi.js` to `pixi8WithComponents({ components })`."
    );
  }
  for (const key of KNOWN_KEYS) {
    const value: unknown = components[key as keyof Pixi8Components];
    if (value !== undefined && typeof value !== "function") {
      throw new Error(
        `\`pixi8WithComponents({ components })\` got \`${printValue(value)}\` for \`${key}\`; expected the class from \`pixi.js\`.`
      );
    }
  }
  const behaviors: Record<string, Behavior> = {};
  for (const tag of Object.keys(factories) as Pixi8Tag[]) {
    const Ctor = components[tag];
    behaviors[tag] = Ctor === undefined ? stub(tag) : build(tag, Ctor, components);
  }
  const adapter: PixiAdapter = {
    components: behaviors,
    defaults,
    properties,
    isPoint: (value): value is PIXI.PointData => value instanceof Point || value instanceof ObservablePoint,
    copyPoint: (target, value) => {
      (target as PIXI.Point).copyFrom(value);
    },
    createApplication: async options => {
      const { Application } = components;
      if (Application === undefined) {
        throw new Error(
          "Add `Application` from `pixi.js` to `pixi8WithComponents({ components })`, or pass an `app` to `Stage`."
        );
      }
      // `view` is the Stage's canvas, or 2.x's name for an external one; PixiJS 8 calls that option `canvas`.
      // Stage passes `view: null` when `options` bring their own canvas.
      const { view, ...rest } = options as { view?: HTMLCanvasElement | null } & Partial<PIXI.ApplicationOptions>;
      const app = new Application();
      await app.init(view == null ? rest : { ...rest, canvas: view });
      return app;
    },
    destroyApplication: (app: PIXI.Application, removeView, stageOptions) => {
      // Destroying a WebGL renderer loses its canvas's context for good. A canvas still in the document may already
      // hold the next application on the same context (StrictMode's second mount, a recreate on `options.view`).
      const context = (app.renderer as Partial<PIXI.WebGLRenderer>).context;
      if (context && (context.canvas as HTMLCanvasElement).isConnected) context.extensions.loseContext = undefined;
      app.destroy({ removeView }, stageOptions as PIXI.DestroyOptions);
    },
    // `instanceof Application` would keep `Application` in every bundle. A provided `app` needs a `Container` as
    // `stage`, and a `ticker` when `usePixiTicker` is used.
    isApplication: value => {
      const stage = (value as { stage?: { addChild?: unknown } | null } | null)?.stage;
      return typeof value === "object" && value !== null && typeof stage?.addChild === "function";
    },
  };
  if (compat !== undefined) {
    if (typeof compat !== "function") {
      throw new Error(
        `\`pixi8({ compat })\` got ${JSON.stringify(compat)}. Pass the default export of \`@react-pixi-fiber/pixi-8/compat/pixi6\` or \`@react-pixi-fiber/pixi-8/compat/pixi7\`, or leave \`compat\` out.`
      );
    }
    adapter.translateProps = compat;
  } else if (__DEV__) {
    adapter.translateProps = warnLegacyProps;
  }
  return adapter;
}
