import invariant from "./invariant";
import warning from "./warning";
import { registerComponent } from "./registry";
import {
  customProperties,
  customStandardNames,
  getOwn,
  PropertyInfoRecord,
  type PropertyInfoRecordConstructor,
} from "./PixiProperty";
import type { PIXIComponentBehavior, PIXIComponentProps, PixiComponent } from "./types";

// Register a component. Returns `type`, which is the tag to render (a component in the type system).
export function PIXIComponent<T extends object, P = {}>(
  type: string,
  behavior: PIXIComponentBehavior<T, P>
): PixiComponent<PIXIComponentProps<T, P>, T> {
  invariant(
    typeof type === "string",
    "Invalid argument `type` of type `%s` supplied to `PIXIComponent`, expected `string`. The signature is `PIXIComponent(type, behavior)`.",
    typeof type
  );
  return registerComponent(type, behavior) as unknown as PixiComponent<PIXIComponentProps<T, P>, T>;
}

let warnedCustomPIXIComponent = false;
/** @deprecated Use `PIXIComponent(type, behavior)`. Removed in 4.0.0. */
export function CustomPIXIComponent<T extends object, P = {}>(
  behavior: PIXIComponentBehavior<T, P>,
  type: string
): PixiComponent<PIXIComponentProps<T, P>, T> {
  if (__DEV__ && !warnedCustomPIXIComponent) {
    warnedCustomPIXIComponent = true;
    warning(
      false,
      "`CustomPIXIComponent(behavior, type)` is deprecated, use `PIXIComponent(type, behavior)`. It will be removed in 4.0.0."
    );
  }
  return PIXIComponent(type, behavior);
}

type Validator = (value: unknown) => boolean;
type ComponentTypes = string | PixiComponent<any, any> | Array<string | PixiComponent<any, any>> | null | undefined;
const ALL_TYPES = "*";

// Register a custom property on given component type(s) so it is not reported as unknown prop in development.
// `maybeType` accepts a component type (e.g. `Sprite`), a list of them, or `null`/`undefined` for all types.
// No-op in production.
export let PIXIProperty: (maybeType: ComponentTypes, propertyName: string, validator?: Validator) => void = () => {};

if (__DEV__) {
  PIXIProperty = function PIXIProperty(maybeType, propertyName, validator) {
    invariant(
      typeof propertyName === "string",
      "Invalid argument `propertyName` of type `%s` supplied to `PIXIProperty`, expected `string`.",
      typeof propertyName
    );
    invariant(
      typeof validator === "undefined" || typeof validator === "function",
      "Validator type for property `%s` is invalid. Expected `function`, got `%s`",
      propertyName,
      typeof validator
    );
    // Tags are strings at runtime.
    const types = maybeType == null ? [ALL_TYPES] : ([] as unknown[]).concat(maybeType as unknown as string[]);
    const lowerCased = propertyName.toLowerCase();
    (types as string[]).forEach(type => {
      invariant(
        !getOwn(getOwn(customProperties, type), propertyName),
        "Property `%s` is already registered on `%s`",
        propertyName,
        type
      );
      customProperties[type] = customProperties[type] || {};
      customProperties[type][propertyName] = new (PropertyInfoRecord as unknown as PropertyInfoRecordConstructor)(
        propertyName,
        validator || (() => true)
      );
      customStandardNames[type] = customStandardNames[type] || {};
      customStandardNames[type][lowerCased] = propertyName;
    });
  };
}

let warnedCustomPIXIProperty = false;
/** @deprecated Use `PIXIProperty`. Removed in 4.0.0. */
export function CustomPIXIProperty(maybeType: ComponentTypes, propertyName: string, validator?: Validator): void {
  if (__DEV__ && !warnedCustomPIXIProperty) {
    warnedCustomPIXIProperty = true;
    warning(false, "`CustomPIXIProperty` is deprecated, use `PIXIProperty`. It will be removed in 4.0.0.");
  }
  return PIXIProperty(maybeType, propertyName, validator);
}
