import * as animated from "animated";
import * as layers from "@pixi/layers";
import * as pixi6 from "@react-pixi-fiber/pixi-6";
import * as pixi from "pixi.js";
import * as react from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as reactDom from "react-dom";
import * as reactPixiFiber from "react-pixi-fiber";
import bunnys from "./examples/assets/bunnys.png";

export const modules: Record<string, unknown> = {
  animated,
  "./assets/bunnys.png": bunnys,
  "@pixi/layers": layers,
  "@react-pixi-fiber/pixi-6": pixi6,
  "pixi.js": pixi,
  react,
  "react-dom": reactDom,
  "react-pixi-fiber": reactPixiFiber,
  "react/jsx-runtime": jsxRuntime,
};
