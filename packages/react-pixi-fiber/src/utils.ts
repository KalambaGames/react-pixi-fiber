import type { PixiAdapter } from "./types";

/* Helper Methods */

export const not =
  <A extends unknown[]>(fn: (...args: A) => unknown) =>
  (...args: A) =>
    !fn(...args);

export const including = (props: readonly string[]) => (key: string) => props.indexOf(key) !== -1;

export const unique = <T>(element: T, index: number, array: T[]) => array.indexOf(element) === index;

export function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(b, keysA[i]) || !Object.is(a[keysA[i]], b[keysA[i]])) return false;
  }
  return true;
}

export function filterByKey<T extends Record<string, unknown>>(
  inputObject: T,
  filter: (key: string) => boolean
): Partial<T> {
  const exportObject: Record<string, unknown> = {};

  Object.keys(inputObject)
    .filter(filter)
    .forEach(key => {
      exportObject[key] = inputObject[key];
    });

  return exportObject as Partial<T>;
}

/* react-reconciler related Methods */

// See https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactTypeOfMode.js
// The StrictMode bit is 1 on React 17 and 8 (StrictLegacyMode) on React 18 and 19; the React adapter supplies it.
export function findStrictRoot(fiber: any, strictModeBit: number): any {
  try {
    let maybeStrictRoot = null;
    let node = fiber;
    while (node != null) {
      if (node.mode & strictModeBit) maybeStrictRoot = node;
      node = node.return;
    }
    return maybeStrictRoot;
  } catch (e) {
    return null;
  }
}

/* PIXI related Methods */

// Converts value to an array of coordinates
export function parsePoint(value: any): number[] {
  let arr: any[] = [];
  if (value == null) {
    return arr;
  } else if (typeof value === "string") {
    arr = value.split(",");
  } else if (typeof value === "number") {
    arr = [value];
  } else if (Array.isArray(value)) {
    // shallow copy the array
    arr = value.slice();
  } else if (typeof value.x !== "undefined" && typeof value.y !== "undefined") {
    arr = [value.x, value.y];
  }

  return arr.map(Number);
}

export function isPointType(value: unknown, pixi: PixiAdapter): boolean {
  return pixi.isPoint(value);
}

export function copyPoint(instance: any, propName: string, value: unknown, pixi: PixiAdapter): void {
  pixi.copyPoint(instance[propName], value as { x: number; y: number });
}

// Set props on a DisplayObject by checking the type. If a PIXI.Point or
// a PIXI.ObservablePoint is having its value set, then either a comma-separated
// string with in the form of "x,y" or a size 2 array with index 0 being the x
// coordinate and index 1 being the y coordinate.
// See: https://github.com/Izzimach/react-pixi/blob/a25196251a13ed9bb116a8576d93e9fceac2a14c/src/ReactPIXI.js#L114
export function setPixiValue(instance: any, propName: string, value: unknown, pixi: PixiAdapter): void {
  if (isPointType(instance[propName], pixi) && isPointType(value, pixi)) {
    // Just copy the data if a Point type is being assigned to a Point type
    copyPoint(instance, propName, value, pixi);
  } else if (isPointType(instance[propName], pixi) && value != null) {
    // Parse value if a non-Point type is being assigned to a Point type. `setValueForProperty` resets a value that
    // does not parse, so the coordinates are valid here.
    const coordinateData = parsePoint(value);
    instance[propName].set(coordinateData.shift(), coordinateData.shift());
  } else {
    // Assign anything else directly. `null` on a point prop reaches the PixiJS setter, which throws when it cannot
    // hold it.
    instance[propName] = value;
  }
}
