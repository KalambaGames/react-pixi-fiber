import * as layers from "@pixi/layers";
import * as pixi6 from "@react-pixi-fiber/pixi-6";
import * as pixi from "pixi.js";
import * as react from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as reactDom from "react-dom";
import * as reactPixiFiber from "react-pixi-fiber";
import bunnys from "./examples/assets/bunnys.png";
import sounds from "./examples/assets/sounds.mp3";
import tinyTown from "./examples/assets/tiny-town.png";
import type { LazyModules } from "playground-shell/runner";

export const modules: Record<string, unknown> = {
  "./assets/bunnys.png": bunnys,
  "./assets/sounds.mp3": sounds,
  "./assets/tiny-town.png": tinyTown,
  "@pixi/layers": layers,
  "@react-pixi-fiber/pixi-6": pixi6,
  "pixi.js": pixi,
  react,
  "react-dom": reactDom,
  "react-pixi-fiber": reactPixiFiber,
  "react/jsx-runtime": jsxRuntime,
};

export const lazyModules: LazyModules = {
  "@pixi/sound": () => import("@pixi/sound"),
  "@pixi/tilemap": () => import("@pixi/tilemap"),
  "@react-spring/core": () => import("@react-spring/core"),
  animated: () => import("animated"),
  gsap: () => import("gsap"),
  "gsap/PixiPlugin": () => import("gsap/PixiPlugin"),
  leva: () => import("leva"),
  "matter-js": () => import("matter-js"),
  motion: () => import("motion"),
  "pixi-viewport": () => import("pixi-viewport"),
  zustand: () => import("zustand"),
};
