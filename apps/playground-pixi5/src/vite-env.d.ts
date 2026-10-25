/// <reference types="vite/client" />
/// <reference types="pixi-spine" />
declare module "animated";
// pixi-spine 2 is a script for the global `PIXI`, and the playground loads its namespace as the module.
declare module "pixi-spine" {
  export = PIXI.spine;
}
