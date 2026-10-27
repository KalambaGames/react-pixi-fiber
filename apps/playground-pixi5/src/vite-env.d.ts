/// <reference types="vite/client" />
/// <reference types="pixi-spine" />
declare module "animated";
declare module "*/assets/bunnys.json" {
  const data: typeof import("./examples/assets/bunnys.json");
  export default data;
}
// pixi-spine 2 is a script for the global `PIXI`, and the playground loads its namespace as the module.
declare module "pixi-spine" {
  export = PIXI.spine;
}
declare module "*/hooks/useSpritesheet" {
  export const useSpritesheet: typeof import("./examples/hooks/useSpritesheet").useSpritesheet;
}
