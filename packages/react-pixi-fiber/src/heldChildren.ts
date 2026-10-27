// A parent that holds children through its own ops may keep them outside `children`, so the core records them in
// order. A move or a removal splices at `indexOf`, O(n) like the removeChild of PixiJS. An append pushes.
const heldBy = new WeakMap<object, object>();
const holds = new WeakMap<object, object[]>();

// Records that `parent` holds `child` through its own ops, at the end or before `before`. A held child moves.
export function holdChild(parent: object, child: object, before?: object): void {
  let held = holds.get(parent);
  if (held === undefined) holds.set(parent, (held = []));
  if (heldBy.get(child) === parent) held.splice(held.indexOf(child), 1);
  else heldBy.set(child, parent);
  const at = before === undefined ? -1 : held.indexOf(before);
  if (at === -1) held.push(child);
  else held.splice(at, 0, child);
}

export function releaseChild(parent: object, child: object): void {
  heldBy.delete(child);
  const held = holds.get(parent);
  if (held === undefined) return;
  const at = held.indexOf(child);
  if (at !== -1) held.splice(at, 1);
}

export function isHeldBy(child: object, parent: object): boolean {
  return heldBy.get(child) === parent;
}

export function heldChildren(parent: object): readonly object[] {
  return holds.get(parent) ?? [];
}
