import type * as React from "react";
import { CustomPIXIComponent, CustomPIXIProperty, PIXIComponent, PIXIProperty } from "./PIXIComponent";
import { PIXIFilter } from "./PIXIFilter";
import { getInstanceTag } from "./registry";
import { AppContext, AppProvider, withApp } from "./AppProvider";
import Stage, { createStageClass } from "./Stage";
import { TAGS } from "./tags";
import { usePixiApp, usePixiTicker } from "./hooks";
import { render as renderLazy, unmount as unmountLazy } from "./render";
import { configure } from "./configure";
import { applyDisplayObjectProps, applyProps } from "./ReactPixiFiberComponent";
import type {
  AnimatedSpriteProps,
  BitmapTextProps,
  ContainerProps,
  GraphicsProps,
  InstanceOf,
  MeshPlaneProps,
  MeshProps,
  MeshRopeProps,
  MeshSimpleProps,
  NineSlicePlaneProps,
  NineSliceSpriteProps,
  ParticleContainerProps,
  PixiComponent,
  SpriteProps,
  StageComponent,
  TextProps,
  TilingSpriteProps,
} from "./types";

export * from "./types";
export type { ApplyPropsContext, Behavior, BehaviorInput } from "./registry";
export type { PixiTickerCallback } from "./hooks";

// Filled by a PixiJS adapter's module augmentation. Empty here so the core compiles without one.
export interface PixiExtraProps {}
export interface PixiInstances {}
export interface PixiTypes {}

// Standalone ReactPixiFiber render method.
const render: (
  pixiElement:
    | React.ReactElement<any>
    | React.ReactElement<any>[]
    | InstanceOf<"Container">
    | InstanceOf<"Container">[],
  stage: InstanceOf<"Container">,
  callback?: Function
) => void = renderLazy as any; // 2.x signature; the adapter takes a React.ReactNode
// Standalone ReactPixiFiber unmount method.
const unmount: (stage: InstanceOf<"Container">) => boolean = unmountLazy;

// `Stage` is both the component and its type; `export { Stage }` below exports both.
// The declaration bundler drops the value in this form, see `stageTypePlugin` in tsdown.config.mts.
type Stage = StageComponent;

/* Public API */

export {
  AppContext,
  applyDisplayObjectProps,
  applyProps,
  AppProvider,
  configure,
  createStageClass,
  CustomPIXIComponent,
  CustomPIXIProperty,
  getInstanceTag,
  PIXIComponent,
  PIXIFilter,
  PIXIProperty,
  render,
  Stage,
  unmount,
  usePixiApp,
  usePixiTicker,
  withApp,
};

// A tag is a string at runtime and a component in the type system.
export const AnimatedSprite = TAGS.AnimatedSprite as unknown as PixiComponent<
  AnimatedSpriteProps,
  InstanceOf<"AnimatedSprite">
>;
export type AnimatedSprite = AnimatedSpriteProps;
export const BitmapText = TAGS.BitmapText as unknown as PixiComponent<BitmapTextProps, InstanceOf<"BitmapText">>;
export type BitmapText = BitmapTextProps;
export const Container = TAGS.Container as unknown as PixiComponent<ContainerProps, InstanceOf<"Container">>;
export type Container = ContainerProps;
export const Graphics = TAGS.Graphics as unknown as PixiComponent<GraphicsProps, InstanceOf<"Graphics">>;
export type Graphics = GraphicsProps;
export const Mesh = TAGS.Mesh as unknown as PixiComponent<MeshProps, InstanceOf<"Mesh">>;
export type Mesh = MeshProps;
export const MeshPlane = TAGS.MeshPlane as unknown as PixiComponent<MeshPlaneProps, InstanceOf<"MeshPlane">>;
export type MeshPlane = MeshPlaneProps;
export const MeshRope = TAGS.MeshRope as unknown as PixiComponent<MeshRopeProps, InstanceOf<"MeshRope">>;
export type MeshRope = MeshRopeProps;
export const MeshSimple = TAGS.MeshSimple as unknown as PixiComponent<MeshSimpleProps, InstanceOf<"MeshSimple">>;
export type MeshSimple = MeshSimpleProps;
/** @deprecated Use `NineSliceSprite`. Removed in 4.0.0. */
export const NineSlicePlane = "NineSlicePlane" as unknown as PixiComponent<
  NineSliceSpriteProps,
  InstanceOf<"NineSliceSprite">
>;
/** @deprecated Use `NineSliceSprite`. Removed in 4.0.0. */
export type NineSlicePlane = NineSlicePlaneProps;
export const NineSliceSprite = TAGS.NineSliceSprite as unknown as PixiComponent<
  NineSliceSpriteProps,
  InstanceOf<"NineSliceSprite">
>;
export type NineSliceSprite = NineSliceSpriteProps;
export const ParticleContainer = TAGS.ParticleContainer as unknown as PixiComponent<
  ParticleContainerProps,
  InstanceOf<"ParticleContainer">
>;
export type ParticleContainer = ParticleContainerProps;
export const Sprite = TAGS.Sprite as unknown as PixiComponent<SpriteProps, InstanceOf<"Sprite">>;
export type Sprite = SpriteProps;
export const Text = TAGS.Text as unknown as PixiComponent<TextProps, InstanceOf<"Text">>;
export type Text = TextProps;
export const TilingSprite = TAGS.TilingSprite as unknown as PixiComponent<
  TilingSpriteProps,
  InstanceOf<"TilingSprite">
>;
export type TilingSprite = TilingSpriteProps;
