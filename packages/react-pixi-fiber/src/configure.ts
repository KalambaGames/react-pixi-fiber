import React from "react";
import { hostOps } from "./hostOps";
import invariant from "./invariant";
import { registerAdapterBehaviors } from "./registry";
import type { PixiAdapter, ReactAdapter, Renderer } from "./types";
import warning from "./warning";

interface Configured {
  react: ReactAdapter;
  pixi: PixiAdapter;
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

export function configure({ react, pixi }: { react: ReactAdapter; pixi: PixiAdapter }): void {
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
  registerAdapterBehaviors(pixi.behaviors);
  configured = { react, pixi, primary, secondary, rendered: false };
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

export function getStrictModeBit(): number {
  return getConfigured().react.strictModeBit;
}

export function getStackAddendum(): string {
  return configured === null ? "" : configured.primary.getStackAddendum();
}
