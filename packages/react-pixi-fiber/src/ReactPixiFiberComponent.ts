// Based on: https://github.com/facebook/react/blob/27535e7bfcb63e8a4d65f273311e380b4ca12eff/packages/react-dom/src/client/ReactDOMFiberComponent.js
import invariant from "./invariant";
import warning from "./warning";
import { getPixiAdapter } from "./configure";
import {
  createRegisteredInstance,
  getAdapterComponent,
  getBoundBehavior,
  getInstanceTag,
  resolveComponent,
  resolveTag,
} from "./registry";
import { getOwn } from "./PixiProperty";
import { setValueForProperty } from "./PixiPropertyOperations";

type Instance = Record<string, any>;
type Props = Record<string, any>;

export const CHILDREN = "children";

const warnedDeprecatedTags = new Set<string>();
const warnedShadowedTags = new Set<string>();

// The adapter's `translateProps` renames props before anything reads them, so validation, the initial write and
// the diff all see the adapter's own prop names.
export function translate(type: string, props: Props): Props {
  if (props == null) return props;
  const pixi = getPixiAdapter();
  return typeof pixi.translateProps === "function" ? pixi.translateProps(type, props) : props;
}

// The adapter's `defaults` for a tag fill the props that are missing or `undefined`, like React's `defaultProps`.
function withDefaults(tag: string, props: Props): Props {
  const defaults = getOwn(getPixiAdapter().defaults, tag);
  if (defaults === undefined || props == null) return props;
  const merged = { ...props };
  for (const key of Object.keys(defaults)) {
    if (merged[key] === undefined) merged[key] = defaults[key];
  }
  return merged;
}

// Tag resolution: the user `PIXIComponent` registry, then the adapter's components, then the deprecated tag map.
export function createInstance(
  type: string,
  props: Props,
  rootContainer?: unknown,
  hostContext?: unknown,
  internalHandle?: unknown
): Instance {
  getPixiAdapter(); // throws the missing-configure error before anything else
  let tag = type;
  let resolved = resolveComponent(type);
  if (resolved && resolved.source === "user") {
    if (__DEV__ && getAdapterComponent(type) && !warnedShadowedTags.has(type)) {
      warnedShadowedTags.add(type);
      warning(
        false,
        "`%s` is registered with PIXIComponent and also defined by the PixiJS adapter. The PIXIComponent registration wins.",
        type
      );
    }
  }
  const resolvedTag = resolveTag(type);
  if (resolvedTag !== type) {
    if (__DEV__ && !warnedDeprecatedTags.has(type)) {
      warnedDeprecatedTags.add(type);
      warning(false, "Tag `%s` is deprecated, use `%s`. It will be removed in 4.0.0.", type, resolvedTag);
    }
    tag = resolvedTag;
    resolved = resolveComponent(tag);
  }
  invariant(
    resolved,
    'ReactPixiFiber does not know the tag `%s`. Register it with `PIXIComponent("%s", behavior)` or pass a PixiJS adapter that defines it to `configure`.',
    type,
    type
  );
  return createRegisteredInstance(
    tag,
    resolved.behavior,
    withDefaults(tag, props),
    applyDisplayObjectProps
  ) as Instance;
}

export function setInitialPixiProperties(
  type: string,
  instance: Instance,
  rawProps: Props,
  rootContainer?: unknown,
  hostContext?: unknown
): void {
  for (const propKey in rawProps) {
    if (!rawProps.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = rawProps[propKey];
    if (propKey === CHILDREN) {
      // Noop. Text children not supported
    } else {
      setValueForProperty(type, instance, propKey, nextProp);
    }
  }
}

export function setInitialProperties(
  type: string,
  instance: Instance,
  rawProps: Props,
  rootContainer?: unknown,
  hostContext?: unknown
): void {
  // components with their own applyProps need to have full control over passed props
  const bound = getBoundBehavior(instance);
  const tag = getInstanceTag(instance) ?? type;
  if (bound && bound.applyProps) {
    bound.applyProps(instance, undefined, withDefaults(tag, rawProps));
    return;
  }

  setInitialPixiProperties(type, instance, withDefaults(tag, translate(type, rawProps)), rootContainer, hostContext);
}

// Calculate the diff between the two objects.
// See: https://github.com/facebook/react/blob/97e2911/packages/react-dom/src/client/ReactDOMFiberComponent.js#L546
export function diffProperties(
  type: string,
  instance: Instance,
  lastRawProps: Props,
  nextRawProps: Props
): unknown[] | null {
  let updatePayload: unknown[] | null = null;

  const lastProps = translate(type, lastRawProps);
  const nextProps = translate(type, nextRawProps);
  let propKey;

  for (propKey in lastProps) {
    if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey)) {
      continue;
    }
    if (propKey === CHILDREN) {
      // Noop. Text children not supported
    } else {
      // A deleted prop is queued as `undefined`, which restores its default; `null` would be written as a value.
      (updatePayload = updatePayload || []).push(propKey, undefined);
    }
  }
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey];
    const lastProp = lastProps != null ? lastProps[propKey] : undefined;
    if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp) {
      continue;
    }
    if (propKey === CHILDREN) {
      // Noop. Text children not supported
    } else {
      // For any other property we always add it to the queue and then we
      // filter it out using the whitelist during the commit.
      (updatePayload = updatePayload || []).push(propKey, nextProp);
    }
  }
  return updatePayload;
}

// Used to apply `newProps` to your `DisplayObject`.
export function applyDisplayObjectProps<T extends object, P>(
  type: string,
  instance: T,
  oldProps: P,
  newProps: P
): void {
  const updatePayload = diffProperties(type, instance, oldProps as Props, newProps as Props);
  if (updatePayload !== null) {
    updatePixiProperties(type, instance, updatePayload);
  }
}

export function updatePixiProperties(
  type: string,
  instance: Instance,
  updatePayload: unknown[],
  prevProps?: Props,
  nextProps?: Props,
  internalHandle?: unknown
): void {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i] as string;
    const propValue = updatePayload[i + 1];
    if (propKey === CHILDREN) {
      // Noop. Text children not supported
    } else {
      setValueForProperty(type, instance, propKey, propValue, internalHandle);
    }
  }
}

// Apply the diff.
export function updateProperties(
  type: string,
  instance: Instance,
  updatePayload: unknown[],
  prevProps?: Props,
  nextProps?: Props,
  internalHandle?: unknown
): void {
  // components with their own applyProps need to have full control over passed props
  const bound = getBoundBehavior(instance);
  if (bound && bound.applyProps) {
    const tag = getInstanceTag(instance) ?? type;
    bound.applyProps(instance, withDefaults(tag, prevProps as Props), withDefaults(tag, nextProps as Props));
    return;
  }

  updatePixiProperties(type, instance, updatePayload, prevProps, nextProps, internalHandle);
}

// Re-applies props to an instance the way the component that created it does: through its own `applyProps`
// when it has one, otherwise through the Display Object prop pipeline for its tag.
export function applyProps(
  instance: any,
  oldProps: Record<string, unknown> | undefined,
  newProps: Record<string, unknown>
): void {
  const bound = getBoundBehavior(instance);
  invariant(
    bound,
    "`applyProps` expects an instance that react-pixi-fiber created. Use `applyDisplayObjectProps(type, instance, oldProps, newProps)` for other Display Objects."
  );
  if (bound.applyProps) {
    bound.applyProps(instance, withDefaults(bound.tag, oldProps as Props), withDefaults(bound.tag, newProps));
  } else {
    applyDisplayObjectProps(bound.tag, instance, oldProps || {}, newProps);
  }
}
