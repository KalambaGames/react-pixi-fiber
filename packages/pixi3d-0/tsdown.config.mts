import { createTsdownConfig } from "../../scripts/tsdown.config.ts";

export default createTsdownConfig({
  name: "pixi3d-0",
  // `@pixi/3d` ships no CommonJS build.
  formats: ["es"],
  external: ["@pixi/3d", "pixi.js"],
  tsconfig: "tsconfig.build.json",
});
