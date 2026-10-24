import * as animated from "animated";
import * as pixi5 from "@react-pixi-fiber/pixi-5";
import "./pixiGlobal";
import "pixi-layers";
import * as pixi from "pixi.js";
import * as react from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as reactDom from "react-dom";
import * as reactPixiFiber from "react-pixi-fiber";
import bunnys from "./examples/assets/bunnys.png";

export const modules: Record<string, unknown> = {
  animated,
  "./assets/bunnys.png": bunnys,
  "@react-pixi-fiber/pixi-5": pixi5,
  "pixi-layers": (globalThis as any).PIXI.display,
  "pixi.js": pixi,
  react,
  "react-dom": reactDom,
  "react-pixi-fiber": reactPixiFiber,
  "react/jsx-runtime": jsxRuntime,
};
