import React from "react";
import Reconciler from "react-reconciler";
import {
  ConcurrentRoot,
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  NoEventPriority,
} from "react-reconciler/constants";
import type { HostOps, ReactAdapter, Renderer } from "react-pixi-fiber";

// https://github.com/facebook/react/blob/v19.3.0/packages/react-reconciler/src/ReactTypeOfMode.js: StrictLegacyMode
export const strictModeBit = 8;
const emptyObject = Object.freeze({});

function noop() {}

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

function getEventPriority(): number {
  const type = typeof window !== "undefined" ? window.event?.type : undefined;
  if (type === undefined) return DefaultEventPriority;
  if (DISCRETE_EVENTS.has(type)) return DiscreteEventPriority;
  return CONTINUOUS_EVENTS.has(type) ? ContinuousEventPriority : DefaultEventPriority;
}

// A host that does not animate: every measurement is the same inert object.
const measurement = Object.freeze({});

// https://github.com/facebook/react/blob/v19.3.0/packages/react-reconciler/src/ReactWorkTags.js
const HostComponent = 5;
const OffscreenComponent = 22;

// The top-level Display Objects under `fiber`, skipping hidden subtrees (a hidden <Activity>, a suspended
// <Suspense>) as the reconciler does when it reports children to the fragment. Portals are walked through: the
// reconciler reports a portal's children to the fragments above it too.
function collectHostChildren(fiber: any, children: unknown[]): void {
  for (; fiber != null; fiber = fiber.sibling) {
    if (fiber.tag === HostComponent) children.push(fiber.stateNode);
    else if (!(fiber.tag === OffscreenComponent && fiber.memoizedState !== null))
      collectHostChildren(fiber.child, children);
  }
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

// The mutation host config of react-reconciler 0.34.0. Keys left out, and the guard that keeps the reconciler from
// reading them: hydration, persistence and test selectors sit behind supportsHydration, supportsPersistence and
// supportsTestSelectors; resources and singletons behind supportsResources and supportsSingletons (both undefined);
// cloneRootViewTransitionContainer, removeRootViewTransitionClone, startGestureTransition and getCurrentGestureOffset
// appear only as bare `config.key;` statements and are never called.
// Typed loosely on purpose: it goes straight into Reconciler, and the declaration stays free of inferred core types.
export function createHostConfig(hostOps: HostOps): Record<string, unknown> {
  let currentUpdatePriority: number = NoEventPriority;
  // The Fragment fiber of each fragment instance; the reconciler swaps it on update.
  const fragmentFibers = new WeakMap<object, { current: any }>();
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
    setCurrentUpdatePriority(priority: number) {
      currentUpdatePriority = priority;
    },
    getCurrentUpdatePriority: () => currentUpdatePriority,
    resolveUpdatePriority: () =>
      currentUpdatePriority !== NoEventPriority ? currentUpdatePriority : getEventPriority(),
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
    commitMount(instance: unknown, type: string, props: Record<string, unknown>, internalHandle: unknown) {
      if (__DEV__) hostOps.validateProperties(type, props, internalHandle);
    },
    commitUpdate(
      instance: unknown,
      type: string,
      prevProps: Record<string, unknown>,
      nextProps: Record<string, unknown>,
      internalHandle: unknown
    ) {
      const payload = hostOps.diffProperties(type, instance, prevProps, nextProps);
      if (payload !== null) hostOps.updateProperties(type, instance, payload, prevProps, nextProps, internalHandle);
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
    rendererPackageName: "react-pixi-fiber",
    rendererVersion: React.version,
    extraDevToolsConfig: null,
    maySuspendCommit: () => false,
    maySuspendCommitOnUpdate: () => false,
    maySuspendCommitInSyncRender: () => false,
    preloadInstance: () => true,
    startSuspendingCommit() {},
    suspendInstance() {},
    waitForCommitToBeReady: () => null,
    getSuspendedCommitReason: () => null,
    shouldAttemptEagerTransition: () => false,
    trackSchedulerEvent() {},
    resolveEventType: () => null,
    resolveEventTimeStamp: () => -1.1,
    resetFormInstance() {},
    bindToConsole: (methodName: "error", args: unknown[]) =>
      Function.prototype.bind.apply(console[methodName], [console, ...args]),
    addViewTransitionFinishedListener: noop,
    applyViewTransitionName: noop,
    cancelRootViewTransitionName: noop,
    cancelViewTransitionName: noop,
    commitNewChildToFragmentInstance: hostOps.commitNewChildToFragmentInstance,
    createFragmentInstance(fiber: unknown) {
      const box = { current: fiber as any };
      const instance = hostOps.createFragmentInstance(() => {
        const children: unknown[] = [];
        collectHostChildren(box.current.child, children);
        return children;
      });
      fragmentFibers.set(instance, box);
      return instance;
    },
    createViewTransitionInstance: (name: string) => ({
      name,
      group: emptyObject,
      imagePair: emptyObject,
      old: emptyObject,
      new: emptyObject,
    }),
    deleteChildFromFragmentInstance: hostOps.deleteChildFromFragmentInstance,
    hasInstanceAffectedParent: () => false,
    hasInstanceChanged: () => false,
    measureClonedInstance: () => measurement,
    measureInstance: () => measurement,
    restoreRootViewTransitionName: noop,
    restoreViewTransitionName: noop,
    // Commits without animating. The passive effects stay with the reconciler, which flushes them on its own.
    startViewTransition(
      suspendedState: unknown,
      container: unknown,
      types: unknown,
      mutationCallback: () => void,
      layoutCallback: () => void,
      afterMutationCallback: () => void,
      spawnedWorkCallback: () => void,
      passiveCallback: () => void,
      errorCallback: (error: unknown) => void,
      blockedCallback: (reason: string) => void,
      finishedAnimation: () => void
    ) {
      mutationCallback();
      layoutCallback();
      afterMutationCallback();
      spawnedWorkCallback();
      finishedAnimation();
      return null;
    },
    stopViewTransition: noop,
    suspendOnActiveViewTransition: noop,
    updateFragmentInstanceFiber(fiber: unknown, instance: object) {
      fragmentFibers.get(instance)!.current = fiber;
    },
    wasInstanceInViewport: () => true,
    NotPendingTransition: null,
    HostTransitionContext: {
      $$typeof: Symbol.for("react.context"),
      Provider: null,
      Consumer: null,
      _currentValue: null,
      _currentValue2: null,
      _threadCount: 0,
    },
  };
}

function getStackAddendum(): string {
  if (!__DEV__) return "";
  const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const getCurrentStack = internals && internals.getCurrentStack;
  if (typeof getCurrentStack !== "function") return "";
  const stack = getCurrentStack();
  return stack != null ? stack : "";
}

function createRenderer(hostOps: HostOps, isPrimaryRenderer: boolean): Renderer {
  const reconciler = Reconciler({
    ...createHostConfig(hostOps),
    isPrimaryRenderer,
  } as any);
  reconciler.injectIntoDevTools();
  const roots = new WeakMap<object, unknown>();
  // Uncaught, caught and recoverable errors are all reported on the console.
  const onError = (error: unknown) => {
    console.error(error);
  };
  return {
    render(element, container, callback, parentComponent) {
      let root = roots.get(container);
      if (!root) {
        root = reconciler.createContainer(
          container,
          ConcurrentRoot,
          null,
          false,
          null,
          "",
          onError,
          onError,
          onError,
          () => {},
          // The published types declare an 11th parameter, transitionCallbacks, that the runtime does not take.
          null
        );
        roots.set(container, root);
      }
      reconciler.updateContainerSync(element, root as any, parentComponent as any, callback as any);
      reconciler.flushSyncWork();
      return reconciler.getPublicRootInstance(root as any);
    },
    unmount(container) {
      const root = roots.get(container);
      if (!root) return false;
      reconciler.updateContainerSync(null, root as any, null, null);
      reconciler.flushSyncWork();
      return true;
    },
    getStackAddendum,
  };
}

// One renderer per core and kind for the lifetime of the page: React DevTools keeps every renderer injected into it,
// and `configure` may be called more than once.
const renderers = new WeakMap<HostOps, { primary?: Renderer; secondary?: Renderer }>();

export default function react19(): ReactAdapter {
  return {
    strictModeBit,
    createRenderer(hostOps, { isPrimaryRenderer }): Renderer {
      let cached = renderers.get(hostOps);
      if (!cached) renderers.set(hostOps, (cached = {}));
      const kind = isPrimaryRenderer ? "primary" : "secondary";
      return cached[kind] || (cached[kind] = createRenderer(hostOps, isPrimaryRenderer));
    },
  };
}
