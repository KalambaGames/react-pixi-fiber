import {
  AmbientLight,
  BatchedMesh3D,
  Camera3D,
  Container3D,
  DirectionalLight,
  Mesh3D,
  Model3D,
  ParticleContainer3D,
  PointLight,
  SpotLight,
  Sprite3D,
} from "@pixi/3d";
import type { Behavior } from "react-pixi-fiber";
import { viewBehavior } from "./view";

// The options of each class that the instance cannot take after construction: it has no member of that name, or only
// a read-only one. A type test checks each list against the typings of `@pixi/3d`.
export const CONSTRUCTOR_ONLY = {
  AmbientLight: [],
  BatchedMesh3D: ["instanceData", "size"],
  Camera3D: [],
  Container3D: [],
  DirectionalLight: [],
  Mesh3D: ["skeleton"],
  Model3D: ["autoPlay", "autoUpdate", "castShadow", "receiveShadow", "scene", "source"],
  ParticleContainer3D: ["alphaCutoff", "alphaMode", "billboard", "capacity", "extraBits", "space", "texture"],
  PointLight: [],
  SpotLight: [],
  Sprite3D: [],
  View3D: ["composite", "graph"],
} as const;

// The size setters measure against the texture, `pixelSize` or geometry, so the adapter writes them last, as the
// constructor does. ponytail: a change of only the texture or geometry does not measure an unchanged size prop again.
// To keep the size, write the size props again when the texture or geometry changes.
function sizeLast(props: Record<string, unknown>): Record<string, unknown> {
  const ordered = { ...props };
  for (const name of ["width", "height", "depth"]) {
    if (name in ordered) {
      const value = ordered[name];
      delete ordered[name];
      ordered[name] = value;
    }
  }
  return ordered;
}

// `create` passes only the constructor-only props. The core writes every other prop after construction, so the value
// it records as the default of a prop is the class default.
export function nodeBehavior(
  Class: new (options: any) => Container3D,
  tag: keyof typeof CONSTRUCTOR_ONLY
): Behavior<Container3D, Record<string, unknown>> {
  const constructorOnly: readonly string[] = CONSTRUCTOR_ONLY[tag];
  return {
    applyProps(node, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps && sizeLast(oldProps), sizeLast(newProps));
    },
    constructorOnly,
    create: props => {
      const options: Record<string, unknown> = {};
      for (const name of constructorOnly) {
        if (props[name] !== undefined) options[name] = props[name];
      }
      return new Class(options);
    },
  };
}

export const behaviors: Record<string, Behavior> = {
  AmbientLight: nodeBehavior(AmbientLight, "AmbientLight"),
  BatchedMesh3D: nodeBehavior(BatchedMesh3D, "BatchedMesh3D"),
  Camera3D: nodeBehavior(Camera3D, "Camera3D"),
  Container3D: nodeBehavior(Container3D, "Container3D"),
  DirectionalLight: nodeBehavior(DirectionalLight, "DirectionalLight"),
  Mesh3D: nodeBehavior(Mesh3D, "Mesh3D"),
  Model3D: nodeBehavior(Model3D, "Model3D"),
  ParticleContainer3D: nodeBehavior(ParticleContainer3D, "ParticleContainer3D"),
  PointLight: nodeBehavior(PointLight, "PointLight"),
  SpotLight: nodeBehavior(SpotLight, "SpotLight"),
  Sprite3D: nodeBehavior(Sprite3D, "Sprite3D"),
  View3D: viewBehavior,
};
