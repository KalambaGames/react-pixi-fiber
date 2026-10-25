import * as pixi4 from "@react-pixi-fiber/pixi-4";
import "./pixiGlobal";
import "pixi-layers";
import * as pixi from "pixi.js";
import * as react from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as reactDom from "react-dom";
import * as reactPixiFiber from "react-pixi-fiber";
import bunnys from "./examples/assets/bunnys.png";
import type { LazyModules } from "playground-shell/runner";

export const modules: Record<string, unknown> = {
  "./assets/bunnys.png": bunnys,
  "@react-pixi-fiber/pixi-4": pixi4,
  "pixi-layers": (globalThis as any).PIXI.display,
  "pixi.js": pixi,
  react,
  "react-dom": reactDom,
  "react-pixi-fiber": reactPixiFiber,
  "react/jsx-runtime": jsxRuntime,
};

export const lazyModules: LazyModules = {
  "@react-spring/core": () => import("@react-spring/core"),
  animated: () => import("animated"),
  gsap: () => import("gsap"),
  "gsap/PixiPlugin": () => import("gsap/PixiPlugin"),
};
