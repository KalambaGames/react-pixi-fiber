import { createTsdownConfig } from "../../scripts/tsdown.config.ts";

export default createTsdownConfig({
  name: "pixi-8",
  // `allClasses` is its own chunk, so a bundler drops it, and every PixiJS class it lists, when the app calls only
  // `pixi8WithClasses`. In the same chunk as the factory, every class stays.
  entries: { allClasses: "src/allClasses.ts", "compat/pixi6": "src/compat/pixi6.ts" },
  external: ["pixi.js"],
  tsconfig: "tsconfig.build.json",
});
