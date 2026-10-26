import {
  createInstance,
  diffProperties,
  setInitialProperties,
  translate,
  updateProperties,
} from "./ReactPixiFiberComponent";
import { getDefaultValue } from "./PixiPropertyOperations";
import { validateProperties as validateUnknownProperties } from "./ReactPixiFiberUnknownPropertyHook";
import {
  destroyOwnedFilters,
  displayBefore,
  forgetChild,
  forgetChildren,
  placeChild,
  placeFilter,
  removeFilter,
} from "./filters";
import { holdChild, isHeldBy, releaseChild } from "./heldChildren";
import { getBoundBehavior, getInstanceTag, isFilterInstance } from "./registry";
import { getStrictModeBit } from "./configure";
import { findStrictRoot } from "./utils";
import invariant from "./invariant";
import type { HostOps, PixiFragmentInstance } from "./types";

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

function afterAddUnlessMove(child: any, isMove: boolean): void {
  if (isMove) return;
  const bound = getBoundBehavior(child);
  if (bound && bound.afterAdd) bound.afterAdd(child);
}

// A parent's behavior may own its child operations; otherwise the Display Object methods are used.
// `afterAdd` runs only when the child joins the parent. A reorder within the same parent is a move, not an add,
// and calls neither `afterAdd` nor `beforeRemove`.
// A filter child joins the parent's `filters` instead, also under a parent that owns its child operations.
export function appendChild(parentInstance: any, child: any): void {
  if (parentInstance == null) return;
  if (isFilterInstance(parentInstance)) invariant(false, "`<%s />` takes no children.", getInstanceTag(parentInstance));

  if (isFilterInstance(child)) {
    afterAddUnlessMove(child, placeFilter(parentInstance, child));
    return;
  }
  const isMove = child.parent === parentInstance || isHeldBy(child, parentInstance);
  appendDisplayChild(parentInstance, child);
  placeChild(parentInstance, child);
  afterAddUnlessMove(child, isMove);
}

export function removeChild(parentInstance: any, child: any): void {
  const bound = getBoundBehavior(child);
  if (bound && bound.beforeRemove) bound.beforeRemove(child);

  if (isFilterInstance(child)) {
    removeFilter(parentInstance, child);
    if (typeof child.destroy === "function") child.destroy();
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

  if (isFilterInstance(child)) {
    afterAddUnlessMove(child, placeFilter(parentInstance, child, beforeChild));
    return;
  }
  const isMove = child.parent === parentInstance || isHeldBy(child, parentInstance);
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
  afterAddUnlessMove(child, isMove);
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
    return;
  }
  const defaultValue = getDefaultValue(instance, prop);
  instance[prop] = typeof defaultValue !== "undefined" ? defaultValue : true;
}

// Development only: validates under a <StrictMode> ancestor, found on the fiber with the React adapter's mode bit.
export function validateProperties(type: string, props: Record<string, unknown>, internalHandle?: unknown): void {
  if (!__DEV__) return;
  if (findStrictRoot(internalHandle, getStrictModeBit()) != null)
    validateUnknownProperties(type, translate(type, props));
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
  diffProperties,
  updateProperties,
  validateProperties,
  commitNewChildToFragmentInstance,
  createFragmentInstance,
  deleteChildFromFragmentInstance,
};
