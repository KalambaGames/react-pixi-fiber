import React from "react";
import Reconciler from "react-reconciler";

import type { HostOps, ReactAdapter, Renderer } from "react-pixi-fiber";

// https://github.com/facebook/react/blob/v17.0.2/packages/react-reconciler/src/ReactTypeOfMode.js: StrictMode
export const strictModeBit = 1;
// https://github.com/facebook/react/blob/v17.0.2/packages/react-reconciler/src/ReactRootTags.js
const LegacyRoot = 0;
const ConcurrentRoot = 2;
const emptyObject = Object.freeze({});

export interface React17Options {
  /**
   * The kind of root Stage and `render` create: `"legacy"` (the default) commits every update synchronously, as 2.x
   * did; `"concurrent"` is the experimental concurrent mode of React 17.
   */
  root?: "concurrent" | "legacy";
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// The mutation host config of react-reconciler 0.26.2. The hydration, persistence and test selector keys are left
// out: the reconciler reads them only behind supportsHydration, supportsPersistence and supportsTestSelectors.
// Typed loosely on purpose: it goes straight into Reconciler, and the declaration stays free of inferred core types.
export function createHostConfig(hostOps: HostOps): Record<string, unknown> {
  return {
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    supportsTestSelectors: false,
    noTimeout: -1,
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    now: () =>
      typeof performance === "object" && typeof performance.now === "function" ? performance.now() : Date.now(),
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

function createRenderer(hostOps: HostOps, isPrimaryRenderer: boolean, rootTag: number): Renderer {
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
      ? (update: () => void) => reconciler.flushSync(update, undefined)
      : (update: () => void) => update();
  return {
    render(element, container, callback, parentComponent) {
      let root = roots.get(container);
      if (!root) {
        // @types/react-reconciler 0.26 declares the createContainer signature of a later reconciler.
        root = (
          reconciler as unknown as {
            createContainer(container: unknown, tag: number, hydrate: boolean, hydrationCallbacks: null): unknown;
          }
        ).createContainer(container, rootTag, false, null);
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

export default function react17({ root = "legacy" }: React17Options = {}): ReactAdapter {
  if (root !== "concurrent" && root !== "legacy") {
    throw new Error(
      `\`react17({ root })\` got ${JSON.stringify(root)}. Pass "concurrent" or "legacy", or leave \`root\` out.`
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
