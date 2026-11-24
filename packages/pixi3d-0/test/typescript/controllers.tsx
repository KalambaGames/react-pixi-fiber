import type * as PIXI3D from "@pixi/3d";
import type { OrbitCamera as PixiOrbitCamera } from "@pixi/3d/extras";
import React from "react";
import type { ControllerNode } from "../../src/index";
import { FPSCamera, OrbitCamera } from "../../src/index";

export const orbit = (
  <OrbitCamera
    target={[0, 1, 0]}
    enableDamping
    maxDistance={20}
    mouseButtons={{ left: "pan" }}
    ref={(node: ControllerNode<PixiOrbitCamera> | null) => node?.controller?.update()}
  />
);
export const orbitForms = <OrbitCamera target={{ x: 0, y: 1, z: 0 }} up="0,1,0" />;
export const fps = <FPSCamera yaw={0} pitch={0} />;
// @ts-expect-error `position` is not a prop: the controller takes it at construction only
export const fpsPosition = <FPSCamera position={1} />;
// @ts-expect-error a vector takes three coordinates
export const orbitTwo = <OrbitCamera target={[0, 1]} />;
declare const view: PIXI3D.View3D;
// @ts-expect-error `view` is not a prop
export const orbitView = <OrbitCamera view={view} />;
// @ts-expect-error canary: an unknown prop is an error
export const orbitNope = <OrbitCamera nope={1} />;
