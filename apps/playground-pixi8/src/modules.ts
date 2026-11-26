import * as pixi from "pixi.js";
import * as react from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as reactDom from "react-dom";

import * as reactPixiFiber from "react-pixi-fiber";
import * as pixi8 from "@react-pixi-fiber/pixi-8";
import type { LazyModules } from "playground-shell/runner";

import bunnysData from "./examples/assets/bunnys.json";
import bunnys from "./examples/assets/bunnys.png";
import fox from "./examples/assets/fox.glb?url";
import sounds from "./examples/assets/sounds.mp3";
import spineboy from "./examples/assets/spineboy.png";
import tinyTown from "./examples/assets/tiny-town.png";
import { useModel } from "./examples/hooks/useModel";
import { useSpritesheet } from "./examples/hooks/useSpritesheet";

export const modules: Record<string, unknown> = {
  "./assets/bunnys.json": { default: bunnysData },
  "./assets/bunnys.png": bunnys,
  "./assets/fox.glb?url": fox,
  "./assets/sounds.mp3": sounds,
  "./assets/spineboy.png": spineboy,
  "./assets/tiny-town.png": tinyTown,
  "./hooks/useModel": { useModel },
  "./hooks/useSpritesheet": { useSpritesheet },
  "@react-pixi-fiber/pixi-8": pixi8,
  "pixi.js": pixi,
  react,
  "react-dom": reactDom,
  "react-pixi-fiber": reactPixiFiber,
  "react/jsx-runtime": jsxRuntime,
};

export const lazyModules: LazyModules = {
  "./assets/spineboy.atlas?raw": () => import("./examples/assets/spineboy.atlas?raw"),
  "./assets/spineboy.json?raw": () => import("./examples/assets/spineboy.json?raw"),
  // It imports @pixi/3d as a value, so it is lazy: in modules it would register the 3D backend in every runner.
  "./components/Floor": () => import("./examples/components/Floor"),
  "@esotericsoftware/spine-pixi-v8": () => import("@esotericsoftware/spine-pixi-v8"),
  "@pixi/3d": () => import("@pixi/3d"),
  "@pixi/layout": () => import("@pixi/layout"),
  "@pixi/layout/components": () => import("@pixi/layout/components"),
  "@pixi/sound": () => import("@pixi/sound"),
  "@pixi/tilemap": () => import("@pixi/tilemap"),
  "@pixi/ui": () => import("@pixi/ui"),
  "@react-pixi-fiber/pixi3d-0": () => import("@react-pixi-fiber/pixi3d-0"),
  "@react-spring/core": () => import("@react-spring/core"),
  animated: () => import("animated"),
  gsap: () => import("gsap"),
  "gsap/PixiPlugin": () => import("gsap/PixiPlugin"),
  leva: () => import("leva"),
  "matter-js": () => import("matter-js"),
  motion: () => import("motion"),
  "pixi-filters": () => import("pixi-filters"),
  "pixi-stats": () => import("pixi-stats"),
  "pixi-viewport": () => import("pixi-viewport"),
  zustand: () => import("zustand"),
};
