import * as PIXI3D from "@pixi/3d";
import * as PIXI from "pixi.js";
import React from "react";

import type { DisplayObjectProps, IsNode3D, PointProperties3D, Props } from "react-pixi-fiber";
import { PIXIComponent, Sprite } from "react-pixi-fiber";

import { Camera3D, Container3D, Mesh3D, Model3D, Sprite3D, View3D } from "../../src/index";

type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
// @ts-expect-error canary: `Equal` is false for different types
export type Canary = Expect<Equal<{ a: 1 }, { a: 2 }>>;

// --- the node test
export type Nodes = [
  Expect<Equal<IsNode3D<PIXI3D.Mesh3D>, true>>,
  Expect<Equal<IsNode3D<PIXI3D.Camera3D>, true>>,
  Expect<Equal<IsNode3D<PIXI3D.View3D>, false>>,
  Expect<Equal<IsNode3D<PIXI.Sprite>, false>>,
  Expect<Equal<IsNode3D<any>, false>>,
  Expect<Equal<IsNode3D<never>, false>>,
];

// --- Display Objects keep their props with the 3D keys loaded
export type Unchanged = [
  Expect<Equal<Props<PIXI.Sprite>, DisplayObjectProps<PIXI.Sprite>>>,
  Expect<Equal<Props<PIXI3D.View3D>, DisplayObjectProps<PIXI3D.View3D>>>,
  Expect<Equal<Props<PIXI.Sprite | PIXI.Text>, DisplayObjectProps<PIXI.Sprite | PIXI.Text>>>,
  Expect<Equal<Props<any>, DisplayObjectProps<any>>>,
  Expect<Equal<Props<never>, DisplayObjectProps<never>>>,
];

// --- which props of a 3D node are points
export type PointKeys = Expect<
  Equal<PointProperties3D<PIXI3D.Container3D>, "position" | "scale" | "rotation" | "angle" | "quaternion" | "origin">
>;

// --- vectors
export const meshTuple = <Mesh3D position={[1, 2, 3]} />;
export const meshObject = <Mesh3D position={{ x: 1, y: 2, z: 3 }} scale={2} rotation="1,2,3" origin={[0, 0, 0]} />;
export const meshAngle = <Mesh3D angle={[0, 90, 0]} />;
export const meshVector = <Mesh3D position={new PIXI3D.Vector3(1, 2, 3)} />;
// @ts-expect-error a vector takes three coordinates, not four
export const meshFour = <Mesh3D position={[1, 2, 3, 4]} />;
// @ts-expect-error a vector takes three coordinates, not two
export const meshTwo = <Mesh3D position={[1, 2]} />;
// @ts-expect-error a vector object needs `z`
export const meshNoZ = <Mesh3D position={{ x: 1, y: 2 }} />;
// @ts-expect-error `angle` takes three coordinates, not four
export const meshAngleFour = <Mesh3D angle={[0, 90, 0, 0]} />;

// --- quaternions
export const quatTuple = <Mesh3D quaternion={[0, 0, 0, 1]} />;
export const quatObject = <Mesh3D quaternion={{ x: 0, y: 0, z: 0, w: 1 }} />;
// @ts-expect-error a quaternion takes four numbers
export const quatThree = <Mesh3D quaternion={[1, 2, 3]} />;
// @ts-expect-error a quaternion is not set from one number
export const quatNumber = <Mesh3D quaternion={1} />;

// --- other props of a 3D node
export const meshOther = (
  <Mesh3D x={1} z={3} visible={false} label="box" ref={(m: PIXI3D.Mesh3D | null) => m?.geometry}>
    <Container3D />
  </Mesh3D>
);
export const meshEvents = <Mesh3D eventMode="static" cursor="pointer" onclick={event => event.stopPropagation()} />;
// @ts-expect-error `eventMode` takes one of the PixiJS event modes
export const meshEventMode = <Mesh3D eventMode="sometimes" />;
// @ts-expect-error canary: an unknown prop is an error
export const meshNope = <Mesh3D nope={1} />;
// @ts-expect-error `z` takes a number
export const meshZ = <Mesh3D z="3" />;
export const camera = <Camera3D position={[0, 1, 5]} fov={60} />;
export const activeCamera = <Camera3D active position={[0, 1, 5]} />;
// @ts-expect-error `active` is a boolean
export const activeNumber = <Camera3D active={1} />;

// --- the view is a Display Object: two-coordinate points
export const view = (
  <View3D position={[1, 2]} scale={2} anchor="0.5,0.5">
    <Mesh3D />
  </View3D>
);
// @ts-expect-error the view takes two coordinates
export const viewThree = <View3D position={[1, 2, 3]} />;
export const sprite = <Sprite position={[1, 2]} />;
// @ts-expect-error a Display Object takes two coordinates
export const spriteThree = <Sprite position={[1, 2, 3]} />;

// --- a 3D class that an app registers
const Box = PIXIComponent<PIXI3D.Mesh3D>("Box", {
  create: () => new PIXI3D.Mesh3D({} as PIXI3D.Mesh3DOptions),
});
export const box = <Box position={[1, 2, 3]} quaternion={[0, 0, 0, 1]} />;
// @ts-expect-error a registered 3D class takes three coordinates
export const boxFour = <Box position={[1, 2, 3, 4]} />;
// @ts-expect-error canary: an unknown prop is an error
export const boxNope = <Box nope={1} />;

const Pin = PIXIComponent<PIXI3D.Mesh3D, { position: string }>("Pin", {
  create: () => new PIXI3D.Mesh3D({} as PIXI3D.Mesh3DOptions),
});
export const pin = <Pin position="home" scale={[1, 1, 1]} />;
// @ts-expect-error props declared on the component replace the instance props
export const pinTuple = <Pin position={[1, 2, 3]} />;

// A registered Display Object is unchanged.
const Label = PIXIComponent<PIXI.Text>("Label", {
  create: () => new PIXI.Text(),
});
export const label = <Label position={[1, 2]} />;
// @ts-expect-error a registered Display Object takes two coordinates
export const labelThree = <Label position={[1, 2, 3]} />;

// --- setter types: `tint` returns a number and its setter takes a color
export const spriteTint = <Sprite3D tint="red" />;
// @ts-expect-error `tint` takes a color
export const spriteTintObject = <Sprite3D tint={{ nope: 1 }} />;
// @ts-expect-error a key only in the options type does not become a prop
export const meshWeights = <Mesh3D weights={[1]} />;

// --- a 2D point on a 3D node
export const spriteAnchor = <Sprite3D anchor={[0.5, 0.5]} />;
export const spriteAnchorString = <Sprite3D anchor="0.5,0.5" position={[1, 2, 3]} />;
// @ts-expect-error `anchor` takes two coordinates
export const spriteAnchorThree = <Sprite3D anchor={[1, 2, 3]} />;

// --- constructor-only props
declare const source: PIXI3D.Scene3DSource;
export const model = <Model3D source={source} autoPlay="Walk" />;
declare const node: PIXI3D.Container3D;
// @ts-expect-error `root` is not a prop of `<View3D />`
export const viewRoot = <View3D root={node} />;
