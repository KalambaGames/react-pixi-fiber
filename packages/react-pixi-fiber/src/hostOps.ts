import { getNodeAdapter, getStrictModeBit } from "./configure";
import {
  destroyOwnedFilters,
  displayBefore,
  forgetChild,
  forgetChildren,
  placeChild,
  placeFilter,
  releaseFilter,
  removeFilter,
} from "./filters";
import { heldChildren, holdChild, isHeldBy, releaseChild } from "./heldChildren";
import invariant from "./invariant";
import { getDefaultValue } from "./PixiPropertyOperations";
import {
  afterMount,
  afterMountRevealed,
  createInstance,
  diffProperties,
  isAfterMountPending,
  setInitialProperties,
  translate,
  updateProperties,
} from "./ReactPixiFiberComponent";
import { validateProperties as validateUnknownProperties } from "./ReactPixiFiberUnknownPropertyHook";
import { getBoundBehavior, getInstanceTag, isFilterInstance } from "./registry";
import type { HostOps, PixiFragmentInstance } from "./types";
import { findStrictRoot } from "./utils";
import warning from "./warning";

function appendDisplayChild(parentInstance: any, child: any): void {
  const ops = getBoundBehavior(parentInstance);
  if (ops && ops.appendChild) {
    ops.appendChild(parentInstance, child);
    holdChild(parentInstance, child);
  } else {
    // TODO do we need to remove the child first if it's already added?
    parentInstance.removeChild(child);

    parentInstance.addChild(child);
  }
}

// A 3D node goes in a 3D node or in a parent that owns its child operations, such as a 3D view.
// A 3D node takes only 3D nodes as children. This check runs before the tree changes.
function checkTree(parentInstance: any, child: any): void {
  const bound = getBoundBehavior(parentInstance);
  if (bound && bound.appendChild) return;
  const childTag = getInstanceTag(child);
  const parentTag = getInstanceTag(parentInstance);
  if (getNodeAdapter(parentInstance)) {
    invariant(
      !isFilterInstance(child),
      "`<%s />` is a filter. It cannot be a child of the 3D node `<%s />`. Put it in the element of the 3D view.",
      childTag,
      parentTag
    );
    invariant(
      getNodeAdapter(child),
      "`<%s />` is not a 3D node. It cannot be a child of the 3D node `<%s />`.",
      childTag,
      parentTag
    );
  } else {
    invariant(
      !getNodeAdapter(child),
      "`<%s />` is a 3D node. It cannot be a child of %s. Put it in a 3D view or in another 3D node.",
      childTag,
      parentTag === undefined ? "the root container" : `\`<${parentTag} />\``
    );
  }
}

// The place of `child` in `parent`: among the filters for a filter, else among the children.
function placeIn(parent: any, child: any): number {
  if (isFilterInstance(child)) return parent.filters ? parent.filters.indexOf(child) : -1;
  return (isHeldBy(child, parent) ? heldChildren(parent) : parent.children).indexOf(child);
}

// `from` is the place of a moved child before the move. A child that keeps its place did not move: React can
// reorder a display child and a filter child, which changes neither `children` nor `filters`.
function afterAddOrMove(parent: any, child: any, isMove: boolean, from: number): void {
  const bound = getBoundBehavior(child);
  if (!bound) return;
  if (!isMove) {
    if (bound.afterAdd) bound.afterAdd(child);
  } else if (bound.afterMove && placeIn(parent, child) !== from) bound.afterMove(child);
}

// A parent's behavior may own its child operations; otherwise the Display Object methods are used.
// `afterAdd` runs only when the child joins the parent. A reorder within the same parent is a move, not an add:
// it calls `afterMove` when the place of the child changes, and neither `afterAdd` nor `beforeRemove`. React places
// one child at a time, so `afterMove` can see siblings that React moves later in the same commit.
// A filter child joins the parent's `filters` instead, also under a parent that owns its child operations.
export function appendChild(parentInstance: any, child: any): void {
  if (parentInstance == null) return;
  if (isFilterInstance(parentInstance)) invariant(false, "`<%s />` takes no children.", getInstanceTag(parentInstance));

  checkTree(parentInstance, child);
  if (isFilterInstance(child)) {
    const from = placeIn(parentInstance, child);
    afterAddOrMove(parentInstance, child, placeFilter(parentInstance, child), from);
    return;
  }
  const isMove = child.parent === parentInstance || isHeldBy(child, parentInstance);
  const from = isMove ? placeIn(parentInstance, child) : -1;
  appendDisplayChild(parentInstance, child);
  placeChild(parentInstance, child);
  afterAddOrMove(parentInstance, child, isMove, from);
}

export function removeChild(parentInstance: any, child: any): void {
  const bound = getBoundBehavior(child);
  if (bound && bound.beforeRemove) bound.beforeRemove(child);

  if (isFilterInstance(child)) {
    removeFilter(parentInstance, child);
    releaseFilter(child);
    return;
  }

  const ops = getBoundBehavior(parentInstance);
  if (ops && ops.removeChild) {
    ops.removeChild(parentInstance, child);
    releaseChild(parentInstance, child);
  } else {
    parentInstance.removeChild(child);
  }
  forgetChild(parentInstance, child);

  destroyOwnedFilters(child);
  // A child that is not a Display Object may have nothing to destroy.
  if (typeof child.destroy === "function") child.destroy({ children: true });
}

export function insertBefore(parentInstance: any, child: any, beforeChild: any): void {
  invariant(child !== beforeChild, "ReactPixiFiber cannot insert node before itself");
  checkTree(parentInstance, child);

  if (isFilterInstance(child)) {
    const from = placeIn(parentInstance, child);
    afterAddOrMove(parentInstance, child, placeFilter(parentInstance, child, beforeChild), from);
    return;
  }
  const isMove = child.parent === parentInstance || isHeldBy(child, parentInstance);
  const from = isMove ? placeIn(parentInstance, child) : -1;
  // Before a filter, the child goes before the next display sibling.
  const target = displayBefore(parentInstance, beforeChild);
  const ops = getBoundBehavior(parentInstance);
  if (target === undefined) {
    appendDisplayChild(parentInstance, child);
  } else if (target === child) {
    // Already in place.
  } else if (ops && ops.insertBefore) {
    ops.insertBefore(parentInstance, child, target);
    holdChild(parentInstance, child, target);
  } else {
    const childExists = parentInstance.children.indexOf(child) !== -1;

    if (childExists) {
      parentInstance.removeChild(child);
    }

    const index = parentInstance.getChildIndex(target);
    parentInstance.addChildAt(child, index);
  }
  placeChild(parentInstance, child, beforeChild);
  afterAddOrMove(parentInstance, child, isMove, from);
}

export function clearContainer(container: any): void {
  if (container) {
    container.removeChildren();
    forgetChildren(container);
  }
}

// A filter hides with `enabled`, a Display Object with `visible`.
function hideProp(instance: any): string {
  return isFilterInstance(instance) ? "enabled" : "visible";
}

export function hideInstance(instance: any): void {
  instance[hideProp(instance)] = false;
}

export function unhideInstance(instance: any, props: Record<string, unknown>): void {
  const prop = hideProp(instance);
  if (typeof props[prop] !== "undefined") {
    instance[prop] = props[prop];
  } else {
    const defaultValue = getDefaultValue(instance, prop);
    instance[prop] = typeof defaultValue !== "undefined" ? defaultValue : true;
  }
  afterMountRevealed(instance);
}

let warnedMissingCommitMount = false;

// A React adapter older than `HostOps.commitMount` validates from its `commitMount` and never calls the core's. A first
// mount (a fiber without `alternate`) whose instance still waits for `afterMount` shows that.
function warnIfCommitMountMissing(type: string, fiber: any): void {
  if (warnedMissingCommitMount || fiber == null || fiber.alternate != null) return;
  if (!isAfterMountPending(fiber.stateNode)) return;
  warnedMissingCommitMount = true;
  warning(
    false,
    "The React adapter did not call `hostOps.commitMount` for `<%s />`, so `afterMount` did not run. Update the React " +
      "adapter to a version that calls it.",
    type
  );
}

// Development only: validates under a <StrictMode> ancestor, found on the fiber with the React adapter's mode bit.
export function validateProperties(type: string, props: Record<string, unknown>, internalHandle?: unknown): void {
  if (!__DEV__) return;
  warnIfCommitMountMissing(type, internalHandle);
  if (findStrictRoot(internalHandle, getStrictModeBit()) != null)
    validateUnknownProperties(type, translate(type, props));
}

// Commit phase, once per new instance, after `afterAdd`. React runs it only for an instance it commits, and not for
// one that it commits inside a hidden <Activity>: `unhideInstance` runs that one.
export function commitMount(
  type: string,
  instance: any,
  props: Record<string, unknown>,
  internalHandle?: unknown
): void {
  afterMount(instance, props);
  validateProperties(type, props, internalHandle);
}

type Listener = (...args: any[]) => void;

// The children are read on each access, so their order stays current; the reconciler reports added and removed
// children only so their listeners follow.
// A child without `on` and `off`, such as a particle, takes no listeners and is skipped. The children leave out
// filters.
class FragmentInstance implements PixiFragmentInstance {
  listeners: [string, Listener][] = [];
  readChildren: () => any[];

  constructor(readChildren: () => any[]) {
    this.readChildren = readChildren;
  }

  get children(): any[] {
    return this.readChildren().filter(child => !isFilterInstance(child));
  }

  getBounds(): any[] {
    return this.children.filter(child => typeof child.getBounds === "function").map(child => child.getBounds());
  }

  off(event: string, fn: Listener): void {
    const count = this.listeners.length;
    this.listeners = this.listeners.filter(([e, f]) => e !== event || f !== fn);
    if (this.listeners.length === count) return;
    for (const child of this.children) if (typeof child.off === "function") child.off(event, fn);
  }

  on(event: string, fn: Listener): void {
    if (this.listeners.some(([e, f]) => e === event && f === fn)) return;
    this.listeners.push([event, fn]);
    for (const child of this.children) if (typeof child.on === "function") child.on(event, fn);
  }
}

// The reconciler can report a child twice (added while hidden, then revealed), and a PixiJS EventEmitter keeps
// duplicates, so each listener is removed before it is added.
export function commitNewChildToFragmentInstance(child: any, instance: PixiFragmentInstance): void {
  if (typeof child.on !== "function" || typeof child.off !== "function" || isFilterInstance(child)) return;
  for (const [event, fn] of (instance as FragmentInstance).listeners) {
    child.off(event, fn);
    child.on(event, fn);
  }
}

export function createFragmentInstance(readChildren: () => any[]): PixiFragmentInstance {
  return new FragmentInstance(readChildren);
}

export function deleteChildFromFragmentInstance(child: any, instance: PixiFragmentInstance): void {
  if (typeof child.off !== "function" || isFilterInstance(child)) return;
  for (const [event, fn] of (instance as FragmentInstance).listeners) child.off(event, fn);
}

export const hostOps: HostOps = {
  createInstance: (type, props, rootContainer) => createInstance(type, props, rootContainer),
  appendChild,
  insertBefore,
  removeChild,
  clearContainer,
  hideInstance,
  unhideInstance,
  setInitialProperties,
  commitMount,
  diffProperties,
  updateProperties,
  validateProperties,
  commitNewChildToFragmentInstance,
  createFragmentInstance,
  deleteChildFromFragmentInstance,
};
