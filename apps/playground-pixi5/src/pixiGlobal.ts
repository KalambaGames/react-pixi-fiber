import * as PIXI from "pixi.js";

// pixi-layers is a script for the global `PIXI`. It patches the classes and adds `PIXI.display`.
// A copy, because a module namespace object cannot get new properties.
(globalThis as any).PIXI = { ...PIXI };
