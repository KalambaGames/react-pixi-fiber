import { heldChildren } from "./heldChildren";
import invariant from "./invariant";
import { getBoundBehavior, getInstanceTag, isFilterInstance } from "./registry";

// Children in order, with a Set for an O(1) membership check on append. A removal still splices at `indexOf`, O(n)
// like the removeChild of PixiJS.
type Order = { items: object[]; members: Set<object> };

// A parent's display children and filter children in JSX order. Only a parent with a filter child has one: PixiJS
// keeps the two apart, so this list is what places a filter between display siblings.
const siblings = new WeakMap<object, Order>();
// The number of parents in `siblings`, which a WeakMap cannot count. At 0, `destroyOwnedFilters` skips its walk.
let parentsWithFilters = 0;

function setSiblings(parent: object, order: Order): void {
  if (!siblings.has(parent)) parentsWithFilters++;
  siblings.set(parent, order);
}

function deleteSiblings(parent: object): void {
  if (siblings.delete(parent)) parentsWithFilters--;
}

// An element uses the `filters` prop or filter children, never both.
function invariantNoFiltersProp(instance: object, value: unknown, type?: string): void {
  invariant(
    value == null,
    "`<%s />` has both a `filters` prop and filter children. Use one: filter children, or the `filters` prop.",
    getInstanceTag(instance) ?? type
  );
}

function assignFilters(parent: any, items: object[]): void {
  const filters = items.filter(isFilterInstance);
  parent.filters = filters.length > 0 ? filters : null;
}

function place(order: Order, child: object, before?: object): boolean {
  const isMove = order.members.has(child);
  if (isMove) order.items.splice(order.items.indexOf(child), 1);
  else order.members.add(child);
  const at = before === undefined ? -1 : order.items.indexOf(before);
  if (at === -1) order.items.push(child);
  else order.items.splice(at, 0, child);
  return isMove;
}

function forget(order: Order, child: object): void {
  if (order.members.delete(child)) order.items.splice(order.items.indexOf(child), 1);
}

export function hasFilterChildren(parent: object): boolean {
  return siblings.has(parent);
}

// Adds or moves `filter` to the end (`before` undefined) or before `before` (a display object or a filter), then
// assigns `parent.filters`. Returns true when the filter was already in this parent's list (a move). The first
// filter child throws when the parent has a `filters` value: React places the child before it removes the prop.
export function placeFilter(parent: any, filter: object, before?: object): boolean {
  let order = siblings.get(parent);
  if (order === undefined) {
    invariant(
      "filters" in parent,
      "`<%s />` has no `filters` property, so it cannot hold filter children.",
      getInstanceTag(parent)
    );
    invariantNoFiltersProp(parent, parent.filters);
    const members = new Set<object>(parent.children ?? []);
    for (const child of heldChildren(parent)) members.add(child);
    order = { items: Array.from(members), members };
    setSiblings(parent, order);
  }
  const isMove = place(order, filter, before);
  assignFilters(parent, order.items);
  return isMove;
}

// Records a display child's position so filter order stays right. No-op for a parent without filter children.
export function placeChild(parent: any, child: object, before?: object): void {
  const order = siblings.get(parent);
  if (order !== undefined) place(order, child, before);
}

// The display object to pass to `getChildIndex`: `before` itself, or the next display sibling after a filter
// `before`. Undefined means append.
export function displayBefore(parent: any, before: object): object | undefined {
  if (!isFilterInstance(before)) return before;
  const order = siblings.get(parent);
  if (order === undefined) return undefined;
  const at = order.items.indexOf(before);
  if (at === -1) return undefined;
  for (let i = at + 1; i < order.items.length; i++) if (!isFilterInstance(order.items[i])) return order.items[i];
  return undefined;
}

// Removes `filter` from the list and assigns `parent.filters` (`null` after the last filter child).
export function removeFilter(parent: any, filter: object): void {
  const order = siblings.get(parent);
  if (order === undefined) return;
  forget(order, filter);
  assignFilters(parent, order.items);
  if (parent.filters === null) deleteSiblings(parent);
}

export function forgetChild(parent: any, child: object): void {
  const order = siblings.get(parent);
  if (order !== undefined) forget(order, child);
}

export function forgetChildren(parent: object): void {
  deleteSiblings(parent);
}

// Checks a write of the `filters` prop on `instance`. With filter children, a value throws, and `null` or `undefined`
// returns true: the write is skipped, so `filters` keeps the children's list.
export function filtersPropWritten(type: string, instance: object, value: unknown): boolean {
  if (!siblings.has(instance)) return false;
  invariantNoFiltersProp(instance, value, type);
  return true;
}

// PixiJS never destroys a filter with its object, and React removes only the topmost node of a removed tree. So this
// walks the tree, also the children a parent holds through its own ops, and destroys each filter child once, after
// its `beforeRemove`.
export function destroyOwnedFilters(root: any): void {
  if (parentsWithFilters === 0) return;
  const order = siblings.get(root);
  if (order !== undefined) {
    deleteSiblings(root);
    for (const item of order.items) {
      if (!isFilterInstance(item)) continue;
      const bound = getBoundBehavior(item);
      if (bound && bound.beforeRemove) bound.beforeRemove(item);
      if (typeof (item as any).destroy === "function") (item as any).destroy();
    }
  }
  if (Array.isArray(root.children)) for (const child of root.children) destroyOwnedFilters(child);
  for (const child of heldChildren(root)) destroyOwnedFilters(child);
}
