import type * as React from "react";
import type { Behavior } from "./registry";
// Declared in index.ts, not here: `declare module "react-pixi-fiber" { interface PixiInstances … }` merges only with an
// interface declared in the module itself, not with one reached through `export * from "./types"` (the reason
// express augmentations target express-serve-static-core). index.ts declares the three empty interfaces and types.ts imports them.
import type { PixiExtraProps, PixiInstances, PixiTypes } from "./index";

/**
 * PixiJS types, filled by a PixiJS adapter's augmentation, with loose fallbacks
 */

type Fallback = Record<string, unknown>;
export type InstanceOf<K extends string> = K extends keyof PixiInstances ? PixiInstances[K] : Fallback;
export type PixiApplication = PixiTypes extends { Application: infer T } ? T : Record<string, any>;
export type PixiApplicationOptions = PixiTypes extends { ApplicationOptions: infer T } ? T : Record<string, unknown>;
export type PixiPoint = PixiTypes extends { Point: infer T } ? T : PointLikeObject;
// `never` when the adapter declares no interaction event.
export type InteractionEvent = PixiTypes extends { InteractionEvent: infer T } ? T : never;

/**
 * Setter types
 */

// A prop is applied by assignment, so PixiJS runs the setter, but a mapped type reads the getter type. An adapter lists
// `[Instance, SetterTypes]` pairs, the most specific class first, for the setters that accept more than their getters
// return.
type SetterTypeList = PixiTypes extends { SetterTypes: infer L } ? L : [];
type FirstSetterTypes<T, L> = L extends [[infer I, infer S], ...infer Rest]
  ? T extends I
    ? S
    : FirstSetterTypes<T, Rest>
  : {};
// The setter types of the first pair that `T` extends, `{}` when none does.
export type SetterTypesOf<T> = FirstSetterTypes<T, SetterTypeList>;
// Widens each property of `T` that `S` lists to accept the setter type too. Keys only in `S` are not added.
export type WithSetterTypes<T, S> = { [K in keyof T]: K extends keyof S ? T[K] | Exclude<S[K], undefined> : T[K] };

/**
 * Interactivity
 */

// Hardcoded event names, kept from 2.x.
export type InteractionPointerEvents =
  | "pointerdown"
  | "pointercancel"
  | "pointerup"
  | "pointertap"
  | "pointerupoutside"
  | "pointermove"
  | "pointerover"
  | "pointerout";
export type InteractionTouchEvents =
  | "touchstart"
  | "touchcancel"
  | "touchend"
  | "touchendoutside"
  | "touchmove"
  | "tap";
export type InteractionMouseEvents =
  | "rightdown"
  | "mousedown"
  | "rightup"
  | "mouseup"
  | "rightclick"
  | "click"
  | "rightupoutside"
  | "mouseupoutside"
  | "mousemove"
  | "mouseover"
  | "mouseout";
export type InteractionPixiEvents = "added" | "removed";
export type InteractionEventTypes =
  | InteractionPointerEvents
  | InteractionTouchEvents
  | InteractionMouseEvents
  | InteractionPixiEvents;
/** @deprecated Import `InteractiveComponent` from the PixiJS adapter. */
export type InteractiveComponent = PixiExtraProps;

/**
 * Helpers
 */

// Returns keys `K` of `T` where type of `T[K]` partially matches `U`.
// e.g. KeysThatMayHaveType<{ foo: string, bar: string | null }, string> -> "foo" | "bar"
// e.g. KeysThatMayHaveType<{ foo: number, bar: string | null }, string> -> "bar"
export type KeysThatMayHaveType<T, U> = { [K in keyof T]: U extends T[K] ? K : never }[keyof T];

// Returns keys `K` of `T` where type of `T[K]` is not specifically `any`.
export type KeysThatAreNotAny<T> = { [K in keyof T]: any extends T[K] ? never : K }[keyof T];

// The shape of `T` with `children` property that React understands.
// Every `PIXI.DisplayObject` we wrap is a `PIXI.Container`, so all of them accept children.
export type PropsWithReactChildren<T> = Omit<T, "children"> & { children?: React.ReactNode };

// Gets the length of an array/tuple type.
// see: https://dev.to/kjleitz/comment/gb5d
export type LengthOfTuple<T extends any[]> = T extends { length: infer L } ? L : never;

// Drops the first element of a tuple.
// see: https://dev.to/kjleitz/comment/gb5d
export type DropFirstInTuple<T extends any[]> = ((...args: T) => any) extends (arg: any, ...rest: infer U) => any
  ? U
  : T;

// Gets the type of the last element of a tuple.
// see: https://dev.to/kjleitz/comment/gb5d
export type LastInTuple<T extends any[]> = T[LengthOfTuple<DropFirstInTuple<T>>];

/**
 * Points
 */

// Point-like object with `x`, `y` keys.
// e.g. `position={{ x: 13, y: 37 }}`
export interface PointLikeObject {
  x: number;
  y: number;
}

// Point-like tuple with `x` and `y` encoded as a single value or provided as a separate values.
// e.g. `pivot={[13, 37]}` or `scale={[2]}` (single element sets both `x` and `y`)
export type PointLikeTuple = [number] | [number, number];

// Point-like number with `x` and `y` encoded  as a single value.
// e.g. `scale={2}`
export type PointLikeNumber = number;

// Point-like string with `x` and `y` separated by a comma.
// e.g. `anchor="1,0.5"`
export type PointLikeString = string;

// Point-like type.
export type PointLike = PixiPoint | PointLikeObject | PointLikeTuple | PointLikeNumber | PointLikeString;

// Properties of `T` that extend `PixiPoint`.
export type PointProperties<T> = Extract<keyof T, Extract<KeysThatMayHaveType<T, PixiPoint>, KeysThatAreNotAny<T>>>;

// Replace type of properties declared in `T` as `PIXI.IPoint` to `PointLike`.
export type WithPointLike<T> =
  // Omit all properties declared it `T` as `PIXI.IPoint`.
  Omit<T, PointProperties<T>> &
    // Pick all point properties from `T` with type changed to `PointLike`.
    Pick<{ [U in PointProperties<T>]: PointLike }, PointProperties<T>>;

/**
 * Base components
 */

// `Instance` is the Display Object a `ref` on the component receives.
export type PixiElement<Props, Instance = Props> = Props & React.ClassAttributes<Instance>;

// This is similar to React.FunctionComponent<P>
// `I` is the Display Object a `ref` on the component receives.
export interface PixiComponent<P = {}, I = P> {
  (props: PixiElement<P, I>): React.ReactElement<P>;
}

// Takes a Display Object type and updates its fields to be used with `ReactPixiFiber`. `PixiExtraProps` adds the props
// the adapter declares for every tag. `S` is passed when `T` is not the class itself, see `PIXIComponentProps`.
// Point props come from the getter types: a setter type such as `{ toString(): string }` of `text` accepts a point too.
export type DisplayObjectProps<T, S = SetterTypesOf<T>> = PropsWithReactChildren<
  Partial<WithSetterTypes<WithPointLike<T>, Omit<S, PointProperties<T>>>>
> &
  PixiExtraProps;
export type Props<T> = DisplayObjectProps<T>;

export type AnimatedSpriteProps = Props<InstanceOf<"AnimatedSprite">> & {
  // `autoUpdate` is not a property on the instance, but is used in constructor
  autoUpdate?: boolean;
};
export type BitmapTextProps = Props<InstanceOf<"BitmapText">> & {
  // `font` and `style` are not properties on the instance, but are used in constructor
  font?: unknown;
  style?: unknown;
};
export type ContainerProps = Props<InstanceOf<"Container">>;
export type GraphicsProps = Props<InstanceOf<"Graphics">>;
export type MeshProps = Props<InstanceOf<"Mesh">>;
export type MeshPlaneProps = Props<InstanceOf<"MeshPlane">> & {
  // Constructor arguments that are not properties on the instance
  verticesX?: number;
  verticesY?: number;
};
export type MeshRopeProps = Props<InstanceOf<"MeshRope">> & {
  // Constructor arguments that are not properties on the instance
  points?: PointLikeObject[];
  textureScale?: number;
};
export type MeshSimpleProps = Props<InstanceOf<"MeshSimple">> & {
  // Constructor arguments that are not properties on the instance
  indices?: Uint16Array | number[];
  uvs?: Float32Array | number[];
};
/** @deprecated Renamed to `NineSliceSpriteProps`, removed in 4.0.0 */
export type NineSlicePlaneProps = NineSliceSpriteProps;
export type NineSliceSpriteProps = Props<InstanceOf<"NineSliceSprite">>;
export type ParticleContainerProps = Props<InstanceOf<"ParticleContainer">> & {
  // Constructor arguments that are not properties on the instance
  dynamicProperties?: Record<string, boolean>;
  maxSize?: number;
  properties?: Partial<Record<"alpha" | "position" | "rotation" | "scale" | "tint" | "uvs" | "vertices", boolean>>;
};
export type SpriteProps = Props<InstanceOf<"Sprite">>;
// `style` takes the setter type when the adapter lists setter types, and stays loose when it does not.
export type TextProps = PixiTypes extends { SetterTypes: unknown }
  ? Props<InstanceOf<"Text">>
  : Omit<Props<InstanceOf<"Text">>, "style"> & { style?: unknown };
export type TilingSpriteProps = Props<InstanceOf<"TilingSprite">>;

/**
 * PixiJS adapter
 */

// Prop names the core types, by kind. Names not listed are set on the instance as-is.
export interface PixiPropertyTable {
  boolean: readonly string[];
  callback: readonly string[];
  numeric: readonly string[];
  positiveNumeric: readonly string[];
  // Container props that are not type-checked. `Stage` puts them and the typed names on `app.stage`, not on the `<canvas>`.
  untypedContainer: readonly string[];
  vector: readonly string[];
}

export interface PixiAdapter {
  components: Record<string, Behavior>;
  defaults?: Record<string, Record<string, unknown>>;
  properties: PixiPropertyTable;
  isPoint(value: unknown): value is { x: number; y: number };
  copyPoint(target: { x: number; y: number }, value: { x: number; y: number }): void;
  createApplication(options: Record<string, unknown>): unknown | Promise<unknown>;
  destroyApplication(app: any, removeView: boolean, stageOptions: unknown): void;
  isApplication(value: unknown): boolean;
  translateProps?(type: string, props: Record<string, unknown>): Record<string, unknown>;
}

/**
 * React adapter
 */

// What `<Fragment ref>` receives: the top-level Display Objects of the fragment, like react-dom's host children.
export interface PixiFragmentInstance {
  readonly children: readonly any[];
  getBounds(): any[];
  off(event: string, fn: (...args: any[]) => void): void;
  on(event: string, fn: (...args: any[]) => void): void;
}

// The core's tree and prop operations, independent of the react-reconciler version. A React adapter builds its
// reconciler host config from them.
export interface HostOps {
  createInstance(type: string, props: Record<string, unknown>, rootContainer: unknown): any;
  appendChild(parent: any, child: any): void;
  insertBefore(parent: any, child: any, before: any): void;
  removeChild(parent: any, child: any): void;
  clearContainer(container: any): void;
  hideInstance(instance: any): void;
  unhideInstance(instance: any, props: Record<string, unknown>): void;
  setInitialProperties(type: string, instance: any, props: Record<string, unknown>): void;
  diffProperties(
    type: string,
    instance: any,
    prevProps: Record<string, unknown>,
    nextProps: Record<string, unknown>
  ): unknown[] | null;
  updateProperties(
    type: string,
    instance: any,
    payload: unknown[] | null,
    prevProps: Record<string, unknown>,
    nextProps: Record<string, unknown>,
    internalHandle?: unknown
  ): void;
  // Development only. `internalHandle` is the fiber, so the core can gate on <StrictMode> with the adapter's bit.
  validateProperties(type: string, props: Record<string, unknown>, internalHandle?: unknown): void;
  // Fragment refs, for a reconciler with fragment instances. `readChildren` returns the fragment's current top-level
  // Display Objects; the adapter reads them from its fibers.
  commitNewChildToFragmentInstance(child: any, instance: PixiFragmentInstance): void;
  createFragmentInstance(readChildren: () => any[]): PixiFragmentInstance;
  deleteChildFromFragmentInstance(child: any, instance: PixiFragmentInstance): void;
}

export interface Renderer {
  render(element: React.ReactNode, container: any, callback?: () => void, parentComponent?: unknown): unknown;
  unmount(container: any): boolean;
  getStackAddendum(): string;
}

export interface ReactAdapter {
  createRenderer(hostOps: HostOps, options: { isPrimaryRenderer: boolean }): Renderer;
  strictModeBit: number;
}

/**
 * Rendering: using Stage component or using render and unmount
 */

export interface StagePropsWithApp {
  app: PixiApplication;
  options?: never;
}
export interface StagePropsWithOptions {
  app?: never;
  options?: PixiApplicationOptions;
}

export type StageAsCanvasProps = React.CanvasHTMLAttributes<HTMLCanvasElement>;
export type StageAsContainerProps = ContainerProps;
// Allow either `app` or `options` passed to `Stage` but not both.
export type StageProps = (StagePropsWithApp | StagePropsWithOptions) &
  Omit<StageAsCanvasProps & StageAsContainerProps, "height" | "width"> & {
    /**
     * Contexts provided around `Stage` that are provided again inside it. React does not pass context between
     * renderers. Keep the number of contexts the same across renders; a change remounts the application.
     */
    bridgeContexts?: React.Context<any>[];
    /** @deprecated Pass `height` in `options`. */
    height?: number;
    /** Called with the application after the first render of `children` into `app.stage`. */
    onInit?: (app: PixiApplication) => void;
    /** @deprecated Pass `width` in `options`. */
    width?: number;
  };

export type StageRef = {
  _app: React.RefObject<PixiApplication>;
  _canvas: React.RefObject<HTMLCanvasElement>;
  props: StageProps;
};

// Type of Stage component.
export type StageComponent = React.ForwardRefExoticComponent<StageProps & { ref?: React.Ref<StageRef> }> & StageRef;

/**
 * Components registered with `PIXIComponent`
 */

// A Display Object created by a `PIXIComponent` behavior.
export type PIXIComponentInstance<T extends object, P> = T;

// Used create an instance of `PIXI.DisplayObject`.
// Also used as a `PIXIComponent` `behavior` factory function.
export type DisplayObjectCreator<T extends object, P> = (props: P) => PIXIComponentInstance<T, P>;

// Props accepted by a `PIXIComponent`: props defined on the component overwrite props of underlying DisplayObject.
// The setter types come from `T`: the `Omit` copy loses the private members a class match needs.
export type PIXIComponentProps<T extends object, P> = P & DisplayObjectProps<Omit<T, keyof P>, SetterTypesOf<T>>;

// `this` available inside `applyProps`, see `registry.ts`.
// `applyDisplayObjectProps` is already bound to `type` and `displayObject`.
export interface DisplayObjectPropSetterContext<T extends object, P> {
  applyDisplayObjectProps: (
    oldProps: Partial<PIXIComponentProps<T, P>> | undefined,
    newProps: Partial<PIXIComponentProps<T, P>>
  ) => void;
}

// Used to apply `newProps` to your `PIXIComponent` in a custom way.
export type DisplayObjectPropSetter<T extends object, P> = (
  this: DisplayObjectPropSetterContext<T, P>,
  displayObject: T,
  oldProps: P | undefined,
  newProps: P
) => void;

// Used to do something after `displayObject` is added to its parent, which happens before `componentDidMount`.
export type DisplayObjectAttachHandler<T extends object> = (displayObject: T) => void;

// Used to do something (usually cleanup) before removing `displayObject`, which happens after `componentWillUnmount`.
export type DisplayObjectDetachHandler<T extends object> = (displayObject: T) => void;

// `PIXIComponent` `behavior` object.
export interface PIXIComponentBehaviorDefinition<T extends object, P> {
  create: DisplayObjectCreator<T, P>;
  applyProps?: DisplayObjectPropSetter<T, P>;
  afterAdd?: DisplayObjectAttachHandler<T>;
  beforeRemove?: DisplayObjectDetachHandler<T>;
}

// The 2.x `behavior` object keys. The registry maps them to the new keys and warns once per key in development.
export interface LegacyPIXIComponentBehaviorDefinition<T extends object, P> {
  /** @deprecated use `create` */
  customDisplayObject: DisplayObjectCreator<T, P>;
  /** @deprecated use `applyProps` */
  customApplyProps?: DisplayObjectPropSetter<T, P>;
  /** @deprecated use `afterAdd` */
  customDidAttach?: DisplayObjectAttachHandler<T>;
  /** @deprecated use `beforeRemove` */
  customWillDetach?: DisplayObjectDetachHandler<T>;
}

// `PIXIComponent` has `behavior` defined either as an object or factory function.
export type PIXIComponentBehavior<T extends object, P> =
  | PIXIComponentBehaviorDefinition<T, P>
  | LegacyPIXIComponentBehaviorDefinition<T, P>
  | DisplayObjectCreator<T, P>;

/** @deprecated Renamed to `PIXIComponentInstance`, removed in 4.0.0 */
export type CustomDisplayObject<T extends object, P> = PIXIComponentInstance<T, P>;
/** @deprecated Renamed to `DisplayObjectCreator`, removed in 4.0.0 */
export type CustomDisplayObjectCreator<T extends object, P> = DisplayObjectCreator<T, P>;
/** @deprecated Renamed to `PIXIComponentProps`, removed in 4.0.0 */
export type CustomPIXIComponentProps<T extends object, P> = PIXIComponentProps<T, P>;
/** @deprecated Renamed to `DisplayObjectPropSetterContext`, removed in 4.0.0 */
export type CustomDisplayObjectPropSetterContext<T extends object, P> = DisplayObjectPropSetterContext<T, P>;
/** @deprecated Renamed to `DisplayObjectPropSetter`, removed in 4.0.0 */
export type CustomDisplayObjectPropSetter<T extends object, P> = DisplayObjectPropSetter<T, P>;
/** @deprecated Renamed to `DisplayObjectAttachHandler`, removed in 4.0.0 */
export type CustomDisplayObjectAttachHandler<T extends object> = DisplayObjectAttachHandler<T>;
/** @deprecated Renamed to `DisplayObjectDetachHandler`, removed in 4.0.0 */
export type CustomDisplayObjectDetachHandler<T extends object> = DisplayObjectDetachHandler<T>;
/** @deprecated Renamed to `PIXIComponentBehaviorDefinition` (new keys), removed in 4.0.0 */
export type CustomPIXIComponentBehaviorDefinition<T extends object, P> = LegacyPIXIComponentBehaviorDefinition<T, P>;
/** @deprecated Renamed to `PIXIComponentBehavior`, removed in 4.0.0 */
export type CustomPIXIComponentBehavior<T extends object, P> = PIXIComponentBehavior<T, P>;

/**
 * `PIXI.Application` context.
 */

// You can use `interface ComponentProps extends PixiAppProperties {}` with component wrapped by `withApp`.
export interface PixiAppProperties {
  app: PixiApplication;
}
