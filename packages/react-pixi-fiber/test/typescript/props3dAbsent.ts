// No 3D adapter in this program: `Props` must be `DisplayObjectProps`.
import type * as PIXI from "pixi.js";

import type {
  DisplayObjectProps,
  InstanceOf,
  IsNode3D,
  Node3DProps,
  Pixi3dAdapter,
  PixiNode3D,
  Props,
} from "react-pixi-fiber";

type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// @ts-expect-error canary: `Equal` is false for different types
export type Canary = Expect<Equal<{ a: 1 }, { a: 2 }>>;

export type Absent = [
  Expect<Equal<PixiNode3D, never>>,
  Expect<Equal<Props<PIXI.Sprite>, DisplayObjectProps<PIXI.Sprite>>>,
  Expect<Equal<Props<PIXI.Sprite | PIXI.Text>, DisplayObjectProps<PIXI.Sprite | PIXI.Text>>>,
  Expect<Equal<Props<InstanceOf<"Nope">>, DisplayObjectProps<InstanceOf<"Nope">>>>,
  Expect<Equal<Props<any>, DisplayObjectProps<any>>>,
  Expect<Equal<Props<never>, DisplayObjectProps<never>>>,
];

export const noNode: IsNode3D<{ position: unknown }> = false;
export const never3d: [PixiNode3D] extends [never] ? true : false = true;
export type { Node3DProps, Pixi3dAdapter };
