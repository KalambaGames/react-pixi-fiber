import type * as PIXI3D from "@pixi/3d";

import { CONSTRUCTOR_ONLY } from "../../src/behaviors";

// An option is constructor-only when the instance has no writable member of that name.
type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;
type WritableKeys<T> = {
  [K in keyof T]-?: IfEquals<{ [Q in K]: T[K] }, { -readonly [Q in K]: T[K] }, K, never>;
}[keyof T];
type ConstructorOnly<I, O> = Exclude<keyof O, WritableKeys<I> | "children" | "parent">;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Listed<K extends keyof typeof CONSTRUCTOR_ONLY> = (typeof CONSTRUCTOR_ONLY)[K][number];

export const ambientLight: Same<
  ConstructorOnly<PIXI3D.AmbientLight, PIXI3D.AmbientLightOptions>,
  Listed<"AmbientLight">
> = true;
export const batchedMesh: Same<
  ConstructorOnly<PIXI3D.BatchedMesh3D, PIXI3D.BatchedMesh3DOptions>,
  Listed<"BatchedMesh3D">
> = true;
export const camera: Same<ConstructorOnly<PIXI3D.Camera3D, PIXI3D.Camera3DOptions>, Listed<"Camera3D">> = true;
export const container: Same<
  ConstructorOnly<PIXI3D.Container3D, PIXI3D.Container3DOptions>,
  Listed<"Container3D">
> = true;
export const directionalLight: Same<
  ConstructorOnly<PIXI3D.DirectionalLight, PIXI3D.DirectionalLightOptions>,
  Listed<"DirectionalLight">
> = true;
export const mesh: Same<ConstructorOnly<PIXI3D.Mesh3D, PIXI3D.Mesh3DOptions>, Listed<"Mesh3D">> = true;
export const model: Same<ConstructorOnly<PIXI3D.Model3D, PIXI3D.Model3DOptions>, Listed<"Model3D">> = true;
export const particles: Same<
  ConstructorOnly<PIXI3D.ParticleContainer3D, PIXI3D.ParticleContainer3DOptions>,
  Listed<"ParticleContainer3D">
> = true;
export const pointLight: Same<
  ConstructorOnly<PIXI3D.PointLight, PIXI3D.PointLightOptions>,
  Listed<"PointLight">
> = true;
export const spotLight: Same<ConstructorOnly<PIXI3D.SpotLight, PIXI3D.SpotLightOptions>, Listed<"SpotLight">> = true;
export const sprite: Same<ConstructorOnly<PIXI3D.Sprite3D, PIXI3D.Sprite3DOptions>, Listed<"Sprite3D">> = true;
export const view: Same<ConstructorOnly<PIXI3D.View3D, PIXI3D.View3DOptions>, Listed<"View3D">> = true;

// Canary: a list that misses a key fails.
// @ts-expect-error `Model3D` reads `source` only in its constructor
export const canary: Same<ConstructorOnly<PIXI3D.Model3D, PIXI3D.Model3DOptions>, "autoPlay"> = true;
