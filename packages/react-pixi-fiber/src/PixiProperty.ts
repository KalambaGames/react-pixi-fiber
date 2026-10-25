// Based on: https://github.com/facebook/react/blob/9c77ffb444598c32c8f92c8d79e406959a10445b/packages/react-dom/src/shared/DOMProperty.js
import type { PixiAdapter } from "./types";
import { parsePoint } from "./utils";

// A reserved attribute.
// It is handled by React separately and shouldn't be written to PIXI tree.
export const RESERVED = 0;

// A simple string attribute.
// Attributes that aren't in the whitelist are presumed to have this type.
export const STRING = 1;

// A real boolean attribute.
// When true, it should be present (set either to an empty string or its name).
export const BOOLEAN = 2;

// An attribute that must be numeric or parse as a numeric.
// When falsy, it should be removed.
export const NUMERIC = 3;

// An attribute that must be positive numeric or parse as a positive numeric.
// When falsy, it should be removed.
export const POSITIVE_NUMERIC = 4;

// An attribute that must be vector or parse as a vector.
// When it does not parse, it should be removed. `null` is written, and throws as it does in PixiJS.
export const VECTOR = 5;

// An attribute that must be function or `null`.
// When it is anything else, it should be removed.
export const CALLBACK = 6;

export function shouldIgnoreAttribute(type: string, name: string, propertyInfo: PropertyInfoRecord | null): boolean {
  return propertyInfo !== null && propertyInfo.type === RESERVED;
}

export function shouldRemoveAttributeWithWarning(
  type: string,
  name: string,
  value: unknown,
  propertyInfo: PropertyInfoRecord | null
): boolean {
  if (propertyInfo !== null && propertyInfo.type === RESERVED) {
    return false;
  }
  // An untyped name is never removed for its value type.
  switch (typeof value) {
    case "boolean":
      return propertyInfo !== null && !propertyInfo.acceptsBooleans;
    case "function":
      return propertyInfo !== null && propertyInfo.type !== CALLBACK;
    case "symbol":
      return true;
    default:
      return false;
  }
}

export function shouldRemoveAttribute(
  type: string,
  name: string,
  value: any,
  propertyInfo: PropertyInfoRecord | null
): boolean {
  if (typeof value === "undefined") {
    return true;
  }
  if (shouldRemoveAttributeWithWarning(type, name, value, propertyInfo)) {
    return true;
  }
  if (propertyInfo !== null) {
    switch (propertyInfo.type) {
      case CALLBACK:
        return value !== null && typeof value !== "function";
      case NUMERIC:
        return isNaN(value);
      case POSITIVE_NUMERIC:
        return isNaN(value) || value < 0;
      case VECTOR:
        if (value === null) return false;
        const vector = parsePoint(value);
        return vector.length === 0 || vector.findIndex(x => isNaN(x)) !== -1;
    }
  }
  return false;
}

const infoCache = new WeakMap<PixiAdapter, Record<string, PropertyInfoRecord>>();
const namesCache = new WeakMap<PixiAdapter, Record<string, string>>();

function buildInfo(pixi: PixiAdapter): Record<string, PropertyInfoRecord> {
  const info: Record<string, PropertyInfoRecord> = {};
  // These props are reserved by React. They shouldn't be written to the PIXI tree.
  ["children", "parent"].forEach(name => {
    info[name] = new (PropertyInfoRecord as unknown as PropertyInfoRecordConstructor)(name, RESERVED);
  });
  const table: Array<[readonly string[], number]> = [
    [pixi.properties.boolean, BOOLEAN],
    [pixi.properties.positiveNumeric, POSITIVE_NUMERIC],
    [pixi.properties.numeric, NUMERIC],
    [pixi.properties.vector, VECTOR],
    [pixi.properties.callback, CALLBACK],
  ];
  table.forEach(([names, type]) =>
    names.forEach(name => {
      info[name] = new (PropertyInfoRecord as unknown as PropertyInfoRecordConstructor)(name, type);
    })
  );
  return info;
}

export function getPropertyInfo(name: string, pixi: PixiAdapter): PropertyInfoRecord | null {
  let info = infoCache.get(pixi);
  if (!info) {
    info = buildInfo(pixi);
    infoCache.set(pixi, info);
  }
  return Object.prototype.hasOwnProperty.call(info, name) ? info[name] : null;
}

// Lowercase name to canonical name for the typed names, for the casing warning.
export function getStandardNames(pixi: PixiAdapter): Record<string, string> {
  let names = namesCache.get(pixi);
  if (!names) {
    const built: Record<string, string> = {};
    const all = [
      ...pixi.properties.boolean,
      ...pixi.properties.positiveNumeric,
      ...pixi.properties.numeric,
      ...pixi.properties.vector,
      ...pixi.properties.callback,
    ];
    all.forEach(name => {
      built[name.toLowerCase()] = name;
    });
    names = built;
    namesCache.set(pixi, names);
  }
  return names;
}

// Checks the properties registered on `type`, then the ones registered on all types (`"*"`).
export function getCustomPropertyInfo(name: string, type: string): PropertyInfoRecord<Validator> | null {
  return getOwn(getOwn(customProperties, type), name) ?? getOwn(getOwn(customProperties, "*"), name) ?? null;
}

// Own keys only, so a prop named like an `Object.prototype` member (`constructor`) is not found.
export function getOwn<T>(record: Record<string, T> | undefined, key: string): T | undefined {
  return record !== undefined && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
}

type Validator = (value: unknown) => boolean;

// `type` is one of the constants above, or the validator of a custom property (see `PIXIProperty`).
export interface PropertyInfoRecord<T = number> {
  acceptsBooleans: boolean;
  propertyName: string;
  type: T;
}
// A constructor function, not a class. Call it with `new` through this type.
export type PropertyInfoRecordConstructor = new <T = number>(name: string, type: T) => PropertyInfoRecord<T>;
export function PropertyInfoRecord(this: PropertyInfoRecord<unknown>, name: string, type: unknown) {
  this.acceptsBooleans = type === BOOLEAN;
  this.propertyName = name;
  this.type = type;
}

// Registered by `PIXIProperty`, keyed by tag or `"*"` for all tags.
export const customProperties: Record<string, Record<string, PropertyInfoRecord<Validator>>> = {};
// Lowercase name to registered name, keyed like `customProperties`, for the casing warning.
export const customStandardNames: Record<string, Record<string, string>> = {};
