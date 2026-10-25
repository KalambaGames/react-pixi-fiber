/// <reference types="vite/client" />
/// <reference types="pixi-tilemap" />
declare module "animated";
// pixi-tilemap 1 is a script for the global `PIXI`, and the playground loads its namespace as the module.
declare module "pixi-tilemap" {
  export = PIXI.tilemap;
}
