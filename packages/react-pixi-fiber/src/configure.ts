import React from "react";
import { hostOps } from "./hostOps";
import invariant from "./invariant";
import { registerAdapterBehaviors } from "./registry";
import { getOwn } from "./PixiProperty";
import type { Pixi3dAdapter, PixiAdapter, ReactAdapter, Renderer } from "./types";
import warning from "./warning";

interface Configured {
  react: ReactAdapter;
  pixi: PixiAdapter;
  pixi3d: Pixi3dAdapter | undefined;
  primary: Renderer;
  secondary: Renderer;
  rendered: boolean;
}

let configured: Configured | null = null;
let warnedReconfigure = false;

function missingConfigureMessage(): string {
  const major = parseInt(React.version, 10) || 18;
  return [
    "react-pixi-fiber is not configured. Install the adapters for your React and PixiJS versions and call `configure` once, before the first render:",
    "",
    `  npm install @react-pixi-fiber/react-${major} @react-pixi-fiber/pixi-N`,
    "",
    '  import { configure } from "react-pixi-fiber";',
    `  import react${major} from "@react-pixi-fiber/react-${major}";`,
    '  import pixiN from "@react-pixi-fiber/pixi-N";',
    "",
    `  configure({ react: react${major}(), pixi: pixiN() });`,
    "",
    "Replace N with your PixiJS major version (4 to 8).",
  ].join("\n");
}

export function configure({
  react,
  pixi,
  pixi3d,
}: {
  react: ReactAdapter;
  pixi: PixiAdapter;
  pixi3d?: Pixi3dAdapter;
}): void {
  invariant(
    react != null && typeof react.createRenderer === "function" && typeof react.strictModeBit === "number",
    "`configure` expects `react` to be the object a React adapter factory returns. Call the factory: `configure({ react: react18(), pixi: pixi6() })`."
  );
  invariant(
    pixi != null &&
      typeof pixi.behaviors === "object" &&
      typeof pixi.properties === "object" &&
      typeof pixi.copyPoint === "function" &&
      typeof pixi.createApplication === "function" &&
      typeof pixi.destroyApplication === "function" &&
      typeof pixi.isApplication === "function" &&
      typeof pixi.isPoint === "function",
    "`configure` expects `pixi` to be the object a PixiJS adapter factory returns. Call the factory: `configure({ react: react18(), pixi: pixi6() })`."
  );
  invariant(
    pixi3d == null ||
      (typeof pixi3d.behaviors === "object" &&
        typeof pixi3d.properties === "object" &&
        typeof pixi3d.isNode === "function" &&
        typeof pixi3d.isPoint === "function" &&
        typeof pixi3d.clonePoint === "function" &&
        typeof pixi3d.setPoint === "function"),
    "`configure` expects `pixi3d` to be the object a PixiJS 3D adapter factory returns. Call the factory: `configure({ react: react19(), pixi: pixi8(), pixi3d: pixi3d0() })`."
  );
  if (pixi3d != null) {
    for (const tag of Object.keys(pixi3d.behaviors)) {
      invariant(
        !Object.prototype.hasOwnProperty.call(pixi.behaviors, tag),
        "`configure` got the tag `%s` from the PixiJS adapter and from the PixiJS 3D adapter. A tag belongs to one adapter.",
        tag
      );
    }
  }
  if (__DEV__ && configured !== null && configured.rendered && !warnedReconfigure) {
    warnedReconfigure = true;
    warning(
      false,
      "`configure` was called again after a render. Trees already rendered keep their React renderer; new PixiJS instances and prop writes everywhere use the new PixiJS adapter."
    );
  }
  // Built before anything is replaced: a throw leaves the previous configuration whole.
  const primary = react.createRenderer(hostOps, { isPrimaryRenderer: true });
  const secondary = react.createRenderer(hostOps, { isPrimaryRenderer: false });
  registerAdapterBehaviors(pixi.behaviors, pixi3d?.behaviors);
  configured = { react, pixi, pixi3d: pixi3d ?? undefined, primary, secondary, rendered: false };
}

export function getConfigured(): Configured {
  // Checked before building the message: this runs on every createInstance and prop write.
  if (configured === null) invariant(false, missingConfigureMessage());
  return configured;
}

export function markRendered(): void {
  if (configured !== null) configured.rendered = true;
}

export function getPixiAdapter(): PixiAdapter {
  return getConfigured().pixi;
}

export function getPixi3dAdapter(): Pixi3dAdapter | undefined {
  return getConfigured().pixi3d;
}

// The 3D adapter, for an instance it owns.
export function getNodeAdapter(instance: unknown): Pixi3dAdapter | undefined {
  const pixi3d = getConfigured().pixi3d;
  return pixi3d !== undefined && pixi3d.isNode(instance) ? pixi3d : undefined;
}

export function getTagDefaults(tag: string): Record<string, unknown> | undefined {
  const { pixi, pixi3d } = getConfigured();
  return getOwn(pixi.defaults, tag) ?? getOwn(pixi3d?.defaults, tag);
}

export function getStrictModeBit(): number {
  return getConfigured().react.strictModeBit;
}

export function getStackAddendum(): string {
  return configured === null ? "" : configured.primary.getStackAddendum();
}
