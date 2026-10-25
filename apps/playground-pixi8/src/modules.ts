import * as pixi8 from "@react-pixi-fiber/pixi-8";
import * as pixi from "pixi.js";
import * as react from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as reactDom from "react-dom";
import * as reactPixiFiber from "react-pixi-fiber";
import bunnys from "./examples/assets/bunnys.png";
import type { LazyModules } from "playground-shell/runner";

export const modules: Record<string, unknown> = {
  "./assets/bunnys.png": bunnys,
  "@react-pixi-fiber/pixi-8": pixi8,
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
