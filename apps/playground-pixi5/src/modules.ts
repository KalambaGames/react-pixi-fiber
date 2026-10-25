import * as pixi5 from "@react-pixi-fiber/pixi-5";
import "./pixiGlobal";
import "pixi-layers";
import * as pixi from "pixi.js";
import * as react from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as reactDom from "react-dom";
import * as reactPixiFiber from "react-pixi-fiber";
import bunnys from "./examples/assets/bunnys.png";
import tinyTown from "./examples/assets/tiny-town.png";
import type { LazyModules } from "playground-shell/runner";

export const modules: Record<string, unknown> = {
  "./assets/bunnys.png": bunnys,
  "./assets/tiny-town.png": tinyTown,
  "@react-pixi-fiber/pixi-5": pixi5,
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
  leva: () => import("leva"),
  "matter-js": () => import("matter-js"),
  motion: () => import("motion"),
  "pixi-tilemap": () => import("pixi-tilemap"),
  "pixi-viewport": () => import("pixi-viewport"),
  zustand: () => import("zustand"),
};
