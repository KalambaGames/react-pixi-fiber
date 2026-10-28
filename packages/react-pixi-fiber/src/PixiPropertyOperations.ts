// Based on: https://github.com/facebook/react/blob/27535e7bfcb63e8a4d65f273311e380b4ca12eff/packages/react-dom/src/client/DOMPropertyOperations.js
import warning from "./warning";
import { getPixiAdapter, getStackAddendum, getStrictModeBit } from "./configure";
import { getRecordedDefault, recordDefault } from "./defaults";
import { filtersPropWritten } from "./filters";
import { getOwn, getPropertyInfo, shouldIgnoreAttribute, shouldRemoveAttribute } from "./PixiProperty";
import { getBoundBehavior, getInstanceTag, isFilterInstance } from "./registry";
import { findStrictRoot, parsePoint, setPixiValue } from "./utils";

const warnedInvalid = new Set<string>();
// The filter props that the instance did not have before the core first wrote them: options the constructor reads.
// A later write of one changes nothing, so an update warns one time.
const constructorOnly = new WeakMap<object, Set<string>>();
// The `constructorOnly` props of a behavior that already warned on an instance.
const warnedConstructorOnly = new WeakMap<object, Set<string>>();

/**
 * The value a prop returns to: the adapter's `defaults` entry for the tag the instance was created as, else the value
 * PixiJS had before the core first wrote the prop.
 */
export function getDefaultValue(instance: Record<string, any>, propName: string, type?: string): unknown {
  // A deprecated tag records the tag it maps to, a user tag records itself.
  const tag = getInstanceTag(instance) ?? type;
  const override = tag === undefined ? undefined : getOwn(getOwn(getPixiAdapter().defaults, tag), propName);
  return typeof override !== "undefined" ? override : getRecordedDefault(instance, propName);
}

// A value that cannot set the point a prop holds, also for a point prop that the adapter table does not list.
function isInvalidPoint(instance: Record<string, any>, propName: string, value: unknown): boolean {
  const pixi = getPixiAdapter();
  if (value == null || !pixi.isPoint(instance[propName]) || pixi.isPoint(value)) return false;
  const coordinates = parsePoint(value);
  return coordinates.length === 0 || coordinates.length > 2 || coordinates.some(x => isNaN(x));
}

/**
 * Sets the value for a property on a PIXI.DisplayObject instance.
 *
 * @param {string} type
 * @param {object} instance
 * @param {string} propName
 * @param {*} value
 * @param {*} internalHandle
 */
export function setValueForProperty(
  type: string,
  instance: Record<string, any>,
  propName: string,
  value: unknown,
  internalHandle?: unknown
): void {
  const pixi = getPixiAdapter();
  const propertyInfo = getPropertyInfo(propName, pixi);
  let strictRoot = null;
  if (__DEV__) {
    strictRoot = findStrictRoot(internalHandle, getStrictModeBit());
  }

  if (shouldIgnoreAttribute(type, propName, propertyInfo)) {
    return;
  }

  if (propName === "filters" && filtersPropWritten(type, instance, value)) return;

  const bound = getBoundBehavior(instance);
  if (bound !== undefined && bound.constructorOnly !== undefined && bound.constructorOnly.includes(propName)) {
    // The initial write has no handle, so only a change after mount warns.
    if (__DEV__ && strictRoot != null) {
      let warned = warnedConstructorOnly.get(instance);
      if (warned === undefined) warnedConstructorOnly.set(instance, (warned = new Set()));
      if (!warned.has(propName)) {
        warned.add(propName);
        warning(
          false,
          "`<%s />` reads `%s` only in its constructor. Give the element a new `key` to change it.%s",
          type,
          propName,
          getStackAddendum()
        );
      }
    }
    return;
  }

  if (__DEV__ && isFilterInstance(instance)) {
    let names = constructorOnly.get(instance);
    if (names === undefined) constructorOnly.set(instance, (names = new Set()));
    if (strictRoot != null && names.has(propName)) {
      names.delete(propName);
      warning(
        false,
        "`<%s />` reads `%s` only in its constructor. Give the element a new `key` to change it.%s",
        type,
        propName,
        getStackAddendum()
      );
    } else if (!(propName in instance)) {
      names.add(propName);
    }
  }

  // Remember what PixiJS had before we ever touch this prop, so a removal can restore it.
  recordDefault(instance, propName, pixi.isPoint);

  let shouldIgnoreValue = false;
  if (shouldRemoveAttribute(type, propName, value, propertyInfo) || isInvalidPoint(instance, propName, value)) {
    // `undefined` is also how a removed prop arrives, so only an invalid value warns, once for each prop name.
    const received = value;
    const shouldWarn = strictRoot != null && typeof received !== "undefined" && !warnedInvalid.has(propName);
    if (shouldWarn) warnedInvalid.add(propName);
    const defaultValue = getDefaultValue(instance, propName, type);
    // A default can itself be `undefined` (`mask`, `filters`, custom props); a name the instance does not have is ignored.
    if (typeof defaultValue !== "undefined" || propName in instance) {
      value = defaultValue;
      if (shouldWarn) {
        warning(
          false,
          "Received `%s` for prop `%s` on `<%s />`. Resetting it to its default `%s`.%s",
          String(received),
          propName,
          type,
          String(value),
          getStackAddendum()
        );
      }
    } else {
      shouldIgnoreValue = true;
      if (shouldWarn) {
        warning(
          false,
          "Received `%s` for prop `%s` on `<%s />`. Cannot determine default value. Ignoring.%s",
          String(received),
          propName,
          type,
          getStackAddendum()
        );
      }
    }
  }

  if (!shouldIgnoreValue) {
    setPixiValue(instance, propName, value, pixi);
  }
}
