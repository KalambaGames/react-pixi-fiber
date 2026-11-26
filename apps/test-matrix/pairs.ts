import type { PixiAdapter, ReactAdapter } from "react-pixi-fiber";
import pixi4 from "@react-pixi-fiber/pixi-4";
import pixi5 from "@react-pixi-fiber/pixi-5";
import pixi6 from "@react-pixi-fiber/pixi-6";
import pixi7 from "@react-pixi-fiber/pixi-7";
import pixi8 from "@react-pixi-fiber/pixi-8";

import { smokeSuite } from "../../packages/react-pixi-fiber/test/utils/smoke";

// No tsconfig here: every PixiJS adapter augments the same core types, so one program cannot type-check all five.
// Vitest strips the types.

// jsdom has no WebGL, PixiJS 4 needs the canvas renderer forced.
const pixi4Canvas = (): PixiAdapter => {
  const adapter = pixi4();
  return {
    ...adapter,
    createApplication: options => adapter.createApplication({ ...options, forceCanvas: true }),
  };
};

const pixiAdapters = { "pixi-4": pixi4Canvas, "pixi-5": pixi5, "pixi-6": pixi6, "pixi-7": pixi7, "pixi-8": pixi8 };

// Runs the smoke suite of the core with one React adapter and every PixiJS adapter.
export function smokeMatrix(name: string, react: () => ReactAdapter) {
  for (const [pixiName, pixi] of Object.entries(pixiAdapters)) {
    smokeSuite(`${name} + ${pixiName}`, () => ({ react: react(), pixi: pixi() }));
  }
}
