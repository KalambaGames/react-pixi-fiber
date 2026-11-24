import { Container3D, Mesh3D } from "@pixi/3d";
import type { Behavior } from "react-pixi-fiber";
import { viewBehavior } from "./view";

export const behaviors: Record<string, Behavior> = {
  Container3D: { create: () => new Container3D() },
  Mesh3D: { create: () => new Mesh3D() },
  View3D: viewBehavior,
};
