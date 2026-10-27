/// <reference types="vite/client" />
/// <reference types="pixi-tilemap" />
/// <reference types="pixi-spine" />
declare module "animated";
declare module "*/assets/bunnys.json" {
  const data: typeof import("./examples/assets/bunnys.json");
  export default data;
}
// pixi-tilemap 1 is a script for the global `PIXI`, and the playground loads its namespace as the module.
declare module "pixi-tilemap" {
  export = PIXI.tilemap;
}
// pixi-spine 1 is a script for the global `PIXI`, and the playground loads its namespace as the module.
declare module "pixi-spine" {
  export = PIXI.spine;
}
