import {
  createInstance,
  diffProperties,
  setInitialProperties,
  translate,
  updateProperties,
} from "./ReactPixiFiberComponent";
import { validateProperties as validateUnknownProperties } from "./ReactPixiFiberUnknownPropertyHook";
import { getBoundBehavior } from "./registry";
import { getStrictModeBit } from "./configure";
import { findStrictRoot } from "./utils";
import invariant from "./invariant";
import type { HostOps, PixiFragmentInstance } from "./types";

// The parent that holds a child through its own ops, for children that have no `parent` of their own.
const heldBy = new WeakMap<object, object>();

// A parent's behavior may own its child operations; otherwise the Display Object methods are used.
// `afterAdd` runs only when the child joins the parent. A reorder within the same parent is a move, not an add,
// and calls neither `afterAdd` nor `beforeRemove`.
export function appendChild(parentInstance: any, child: any): void {
  if (parentInstance == null) return;

  const isMove = child.parent === parentInstance || heldBy.get(child) === parentInstance;
  const ops = getBoundBehavior(parentInstance);
  if (ops && ops.appendChild) {
    ops.appendChild(parentInstance, child);
    heldBy.set(child, parentInstance);
  } else {
    // TODO do we need to remove the child first if it's already added?
    parentInstance.removeChild(child);

    parentInstance.addChild(child);
  }
  if (isMove) return;
  const bound = getBoundBehavior(child);
  if (bound && bound.afterAdd) bound.afterAdd(child);
}

export function removeChild(parentInstance: any, child: any): void {
  const bound = getBoundBehavior(child);
  if (bound && bound.beforeRemove) bound.beforeRemove(child);

  const ops = getBoundBehavior(parentInstance);
  if (ops && ops.removeChild) {
    ops.removeChild(parentInstance, child);
    heldBy.delete(child);
  } else {
    parentInstance.removeChild(child);
  }

  // A child that is not a Display Object may have nothing to destroy.
  if (typeof child.destroy === "function") child.destroy({ children: true });
}

export function insertBefore(parentInstance: any, child: any, beforeChild: any): void {
  invariant(child !== beforeChild, "ReactPixiFiber cannot insert node before itself");

  const isMove = child.parent === parentInstance || heldBy.get(child) === parentInstance;
  const ops = getBoundBehavior(parentInstance);
  if (ops && ops.insertBefore) {
    ops.insertBefore(parentInstance, child, beforeChild);
    heldBy.set(child, parentInstance);
  } else {
    const childExists = parentInstance.children.indexOf(child) !== -1;

    if (childExists) {
      parentInstance.removeChild(child);
    }

    const index = parentInstance.getChildIndex(beforeChild);
    parentInstance.addChildAt(child, index);
  }
  if (isMove) return;
  const bound = getBoundBehavior(child);
  if (bound && bound.afterAdd) bound.afterAdd(child);
}

export function clearContainer(container: any): void {
  if (container) {
    container.removeChildren();
  }
}

export function hideInstance(instance: any): void {
  instance.visible = false;
}

export function unhideInstance(instance: any, props: Record<string, unknown>): void {
  instance.visible = typeof props.visible !== "undefined" ? props.visible : true;
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
// A child without `on` and `off`, such as a particle, takes no listeners and is skipped.
class FragmentInstance implements PixiFragmentInstance {
  listeners: [string, Listener][] = [];
  readChildren: () => any[];

  constructor(readChildren: () => any[]) {
    this.readChildren = readChildren;
  }

  get children(): any[] {
    return this.readChildren();
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
  if (typeof child.on !== "function" || typeof child.off !== "function") return;
  for (const [event, fn] of (instance as FragmentInstance).listeners) {
    child.off(event, fn);
    child.on(event, fn);
  }
}

export function createFragmentInstance(readChildren: () => any[]): PixiFragmentInstance {
  return new FragmentInstance(readChildren);
}

export function deleteChildFromFragmentInstance(child: any, instance: PixiFragmentInstance): void {
  if (typeof child.off !== "function") return;
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
