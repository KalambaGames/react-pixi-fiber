// Type-checked by `check-types`, not run: `destroyOptions` of `Stage` takes a boolean or the PixiJS 5 destroy options.
import type { StageProps } from "react-pixi-fiber";

export const stage: StageProps = { destroyOptions: false, options: {} };
export const stageWithObject: StageProps = {
  destroyOptions: { baseTexture: true, children: true, texture: true },
  options: {},
};
