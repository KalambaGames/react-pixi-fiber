import React from "react";
import Reconciler from "react-reconciler";
import {
  ConcurrentRoot,
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  LegacyRoot,
} from "react-reconciler/constants";

import type { HostOps, ReactAdapter, Renderer } from "react-pixi-fiber";

// https://github.com/facebook/react/blob/v18.3.1/packages/react-reconciler/src/ReactTypeOfMode.js: StrictLegacyMode
export const strictModeBit = 8;
const emptyObject = Object.freeze({});

export interface React18Options {
  /**
   * The kind of root Stage and `render` create: `"legacy"` (the default) commits every update synchronously, as 2.x
   * did; `"concurrent"` enables transitions, Suspense and update priorities.
   */
  root?: "concurrent" | "legacy";
}

// The DOM events PixiJS dispatches its handlers from, with the priority react-dom gives an update inside them.
const DISCRETE_EVENTS = new Set([
  "click",
  "contextmenu",
  "dblclick",
  "keydown",
  "keyup",
  "mousedown",
  "mouseup",
  "pointercancel",
  "pointerdown",
  "pointerup",
  "touchcancel",
  "touchend",
  "touchstart",
]);
const CONTINUOUS_EVENTS = new Set([
  "mouseenter",
  "mouseleave",
  "mousemove",
  "mouseout",
  "mouseover",
  "pointerenter",
  "pointerleave",
  "pointermove",
  "pointerout",
  "pointerover",
  "touchmove",
  "wheel",
]);

// A legacy root ignores the priority: every update on it is synchronous.
function getEventPriority(): number {
  const type = typeof window !== "undefined" ? window.event?.type : undefined;
  if (type === undefined) return DefaultEventPriority;
  if (DISCRETE_EVENTS.has(type)) return DiscreteEventPriority;
  return CONTINUOUS_EVENTS.has(type) ? ContinuousEventPriority : DefaultEventPriority;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const scheduleMicrotask: (callback: () => void) => void =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : typeof Promise !== "undefined"
      ? callback =>
          Promise.resolve(null)
            .then(callback)
            .catch(error => {
              setTimeout(() => {
                throw error;
              });
            })
      : setTimeout;

// The mutation host config of react-reconciler 0.29.2. The hydration, persistence and test selector keys are left
// out: the reconciler reads them only behind supportsHydration, supportsPersistence and supportsTestSelectors.
// Typed loosely on purpose: it goes straight into Reconciler, and the declaration stays free of inferred core types.
export function createHostConfig(hostOps: HostOps): Record<string, unknown> {
  return {
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    supportsMicrotasks: true,
    supportsTestSelectors: false,
    noTimeout: -1,
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    scheduleMicrotask,
    now: () =>
      typeof performance === "object" && typeof performance.now === "function" ? performance.now() : Date.now(),
    getCurrentEventPriority: getEventPriority,
    getRootHostContext: () => emptyObject,
    getChildHostContext: (parentHostContext: unknown) => parentHostContext,
    getPublicInstance: (instance: unknown) => instance,
    prepareForCommit: () => null,
    resetAfterCommit() {},
    preparePortalMount() {},
    shouldSetTextContent: () => false,
    createInstance: (type: string, props: Record<string, unknown>, rootContainer: unknown) =>
      hostOps.createInstance(type, props, rootContainer),
    createTextInstance() {
      invariant(false, "ReactPixiFiber does not support text instances. Use `Text` component instead.");
    },
    appendInitialChild: hostOps.appendChild,
    appendChild: hostOps.appendChild,
    appendChildToContainer: hostOps.appendChild,
    insertBefore: hostOps.insertBefore,
    insertInContainerBefore: hostOps.insertBefore,
    removeChild: hostOps.removeChild,
    removeChildFromContainer: hostOps.removeChild,
    clearContainer: hostOps.clearContainer,
    hideInstance: hostOps.hideInstance,
    unhideInstance: hostOps.unhideInstance,
    hideTextInstance() {},
    unhideTextInstance() {},
    finalizeInitialChildren(instance: unknown, type: string, props: Record<string, unknown>) {
      hostOps.setInitialProperties(type, instance, props);
      return true;
    },
    // Commit phase, once per new instance: `finalizeInitialChildren` returns `true` for every instance.
    commitMount(instance: unknown, type: string, props: Record<string, unknown>, internalHandle: unknown) {
      hostOps.commitMount(type, instance, props, internalHandle);
    },
    prepareUpdate(
      instance: unknown,
      type: string,
      oldProps: Record<string, unknown>,
      newProps: Record<string, unknown>
    ) {
      return hostOps.diffProperties(type, instance, oldProps, newProps);
    },
    commitUpdate(
      instance: unknown,
      payload: unknown[],
      type: string,
      prevProps: Record<string, unknown>,
      nextProps: Record<string, unknown>,
      internalHandle: unknown
    ) {
      hostOps.updateProperties(type, instance, payload, prevProps, nextProps, internalHandle);
      if (__DEV__) hostOps.validateProperties(type, nextProps, internalHandle);
    },
    commitTextUpdate() {},
    resetTextContent() {},
    detachDeletedInstance() {},
    prepareScopeUpdate() {},
    getInstanceFromNode() {
      invariant(false, "Not yet implemented.");
    },
    getInstanceFromScope() {
      invariant(false, "Not yet implemented.");
    },
    beforeActiveInstanceBlur() {},
    afterActiveInstanceBlur() {},
  };
}

function getStackAddendum(): string {
  if (!__DEV__) return "";
  const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  const frame = internals && internals.ReactDebugCurrentFrame;
  if (frame == null) return "";
  const stack = frame.getStackAddendum();
  return stack != null ? stack : "";
}

function createRenderer(
  hostOps: HostOps,
  isPrimaryRenderer: boolean,
  rootTag: typeof ConcurrentRoot | typeof LegacyRoot
): Renderer {
  const reconciler = Reconciler({ ...createHostConfig(hostOps), isPrimaryRenderer } as any);
  reconciler.injectIntoDevTools({
    findFiberByHostInstance: () => null,
    bundleType: __DEV__ ? 1 : 0,
    version: React.version,
    rendererPackageName: "react-pixi-fiber",
  });
  const roots = new WeakMap<object, unknown>();
  // A concurrent root commits the first render and the unmount before they return, as a legacy root does, so Stage
  // reads its tree in the same effect on both.
  const commit =
    rootTag === ConcurrentRoot
      ? (update: () => void) => reconciler.flushSync(update)
      : (update: () => void) => update();
  return {
    render(element, container, callback, parentComponent) {
      let root = roots.get(container);
      if (!root) {
        root = reconciler.createContainer(container, rootTag, null, false, null, "", console.error, null);
        roots.set(container, root);
      }
      commit(() => {
        reconciler.updateContainer(element, root as any, parentComponent as any, callback as any);
      });
      return reconciler.getPublicRootInstance(root as any);
    },
    unmount(container) {
      const root = roots.get(container);
      if (!root) return false;
      commit(() => {
        reconciler.updateContainer(null, root as any, null, null);
      });
      return true;
    },
    getStackAddendum,
  };
}

// One renderer per core, kind and root for the lifetime of the page: React DevTools keeps every renderer injected into
// it, and `configure` may be called more than once.
const renderers = new WeakMap<HostOps, Record<string, Renderer>>();

export default function react18({ root = "legacy" }: React18Options = {}): ReactAdapter {
  if (root !== "concurrent" && root !== "legacy") {
    throw new Error(
      `\`react18({ root })\` got ${JSON.stringify(root)}. Pass "concurrent" or "legacy", or leave \`root\` out.`
    );
  }
  const rootTag = root === "concurrent" ? ConcurrentRoot : LegacyRoot;
  return {
    strictModeBit,
    createRenderer(hostOps, { isPrimaryRenderer }): Renderer {
      let cached = renderers.get(hostOps);
      if (!cached) renderers.set(hostOps, (cached = {}));
      const key = `${isPrimaryRenderer ? "primary" : "secondary"} ${root}`;
      return cached[key] || (cached[key] = createRenderer(hostOps, isPrimaryRenderer, rootTag));
    },
  };
}
