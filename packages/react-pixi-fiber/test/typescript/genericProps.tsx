// An app-style wrapper, generic over the instance type. This file must compile.
import "@react-pixi-fiber/pixi-6";
import type * as PIXI from "pixi.js";
import * as React from "react";

import type { PIXIComponentProps, Props } from "react-pixi-fiber";
import { Sprite } from "react-pixi-fiber";

export function passOn<T extends PIXI.Container>(props: Props<T>): Props<T> {
  const { children } = props;
  return { ...props, children };
}
export function count<T extends PIXI.Container>(props: Props<T>): number {
  return React.Children.count(props.children);
}
export function withDefaults<T extends PIXI.Sprite>(props: Props<T>): Props<PIXI.Sprite> {
  return props;
}
export function custom<T extends PIXI.Sprite, P extends { label: string }>(props: PIXIComponentProps<T, P>): string {
  return props.label;
}
export function Wrapper<T extends PIXI.Sprite>(props: Props<T>) {
  return <Sprite {...props} />;
}
