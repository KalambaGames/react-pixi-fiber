import { EulerDegrees, ObservableQuaternion, ObservableVector3 } from "@pixi/3d";
import { ObservablePoint, Point } from "pixi.js";

const NAMES = ["x", "y", "z", "w"] as const;

// `Number("")` is 0, so an empty part is not a coordinate.
const parsePart = (part: string): number => (part.trim() === "" ? Number.NaN : Number(part));

// The coordinates of `value` for a point of `size` coordinates, or `null` when `value` cannot set that point. A number
// or a string with one part sets every coordinate, for a 2D point and a vector only.
export function parseCoordinates(value: unknown, size: 2 | 3 | 4): number[] | null {
  let parts: unknown[];
  if (typeof value === "number" && size < 4) {
    parts = Array(size).fill(value);
  } else if (typeof value === "string" && size < 4) {
    parts = value.split(",").map(parsePart);
    if (parts.length === 1) parts = Array(size).fill(parts[0]);
  } else if (Array.isArray(value)) {
    parts = value;
  } else if (typeof value === "object" && value !== null) {
    parts = NAMES.slice(0, size).map(name => (value as Record<string, unknown>)[name]);
  } else {
    return null;
  }
  if (parts.length !== size) return null;
  return parts.every(Number.isFinite) ? (parts as number[]) : null;
}

export function isPoint(value: unknown): boolean {
  return (
    value instanceof ObservableVector3 ||
    value instanceof ObservableQuaternion ||
    value instanceof EulerDegrees ||
    value instanceof ObservablePoint ||
    value instanceof Point
  );
}

// `ObservableVector3.clone()` keeps the observer of the node, and `EulerDegrees` has no `clone`.
export function clonePoint(point: object): object {
  const source = point as Record<string, unknown>;
  const copy: Record<string, number> = {};
  for (const name of NAMES) {
    if (typeof source[name] === "number") copy[name] = source[name];
  }
  return copy;
}

export function hasSetter(object: object, name: string): boolean {
  for (let current: object | null = object; current !== null; current = Object.getPrototypeOf(current)) {
    const descriptor = Object.getOwnPropertyDescriptor(current, name);
    if (descriptor !== undefined) return descriptor.set !== undefined;
  }
  return false;
}

// Assigns through the class setter, the supported way to write a point of `@pixi/3d`, when the member has one.
export function setPoint(instance: object, propName: string, value: unknown): boolean {
  const target = instance as Record<string, unknown>;
  const size = Object.keys(clonePoint(target[propName] as object)).length as 2 | 3 | 4;
  const coordinates = parseCoordinates(value, size);
  if (coordinates === null) return false;
  const point: Record<string, number> = {};
  coordinates.forEach((coordinate, i) => {
    point[NAMES[i]] = coordinate;
  });
  // A member without a setter, as `Camera3D.jitter`, is written in place.
  if (hasSetter(target, propName)) target[propName] = point;
  else Object.assign(target[propName] as object, point);
  return true;
}
