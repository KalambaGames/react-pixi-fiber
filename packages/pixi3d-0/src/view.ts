import { Camera3D, Container3D, View3D } from "@pixi/3d";
import type { Behavior } from "react-pixi-fiber";
import warning from "./warning";

// The views this adapter created, by their root, and the camera each view had at creation or got from the fallback.
const views = new WeakMap<Container3D, View3D>();
const ownCameras = new WeakMap<View3D, Camera3D>();
// The cameras that have the `active` prop, and the nodes that call `guardCamera` when they hide or show.
const activeCameras = new WeakSet<Container3D>();
const watched = new WeakSet<Container3D>();

// The views that warned about more than one active camera, and the views with a check queued.
const warnedActive = new WeakSet<View3D>();
const checking = new Set<View3D>();

let warnedCamera = false;
let warnedRoot = false;

// `View3D.addChild` throws: the children of `<View3D>` are the scene, in `view.root`.
function check(child: unknown): asserts child is Container3D {
  if (!(child instanceof Container3D)) {
    throw new Error(
      "`View3D` takes only 3D nodes as children. Put a Display Object next to the view, for example a label after `<View3D>`."
    );
  }
}

function contains(ancestor: Container3D | undefined, node: Container3D): boolean {
  for (let current: Container3D | null = node; current !== null; current = current.parent) {
    if (current === ancestor) return true;
  }
  return false;
}

export function viewOf(node: Container3D): View3D | undefined {
  let top = node;
  while (top.parent !== null) top = top.parent;
  return views.get(top);
}

function hasActive(node: Container3D): boolean {
  return activeCameras.has(node) || node.children.some(child => child instanceof Container3D && hasActive(child));
}

// The last active camera in depth-first order that is visible with all its ancestors.
function lastActive(node: Container3D, skip: Container3D | undefined): Camera3D | undefined {
  let found: Camera3D | undefined;
  for (const child of node.children) {
    if (!(child instanceof Container3D) || !child.visible || child === skip) continue;
    if (activeCameras.has(child)) found = child as Camera3D;
    found = lastActive(child, skip) ?? found;
  }
  return found;
}

// The last active camera, else the last visible direct camera that is not the own camera, else the own camera.
// Nothing in `skip` counts. An own camera that the app destroyed or moved out of the view is replaced by a new one,
// first in the root.
function choose(view: View3D, skip?: Container3D): void {
  let own = ownCameras.get(view)!;
  let camera = lastActive(view.root, skip);
  if (camera === undefined) {
    for (const child of view.root.children) {
      if (child instanceof Camera3D && child !== own && child.visible && !contains(skip, child)) camera = child;
    }
  }
  if (camera === undefined) {
    if (viewOf(own) !== view || contains(skip, own)) {
      own = new Camera3D();
      ownCameras.set(view, own);
      view.root.addChildAt(own, 0);
    }
    camera = own;
  }
  view.camera = camera;
  if (__DEV__) checkActive(view);
}

// Visible active cameras under `node`, each with all its ancestors visible.
function countActive(node: Container3D): number {
  let count = 0;
  for (const child of node.children) {
    if (!(child instanceof Container3D) || !child.visible) continue;
    if (activeCameras.has(child)) count++;
    count += countActive(child);
  }
  return count;
}

// The check runs after the commit. In one commit, React can set `active` on the new camera before it clears it on the
// old one.
function checkActive(view: View3D): void {
  if (warnedActive.has(view) || checking.has(view)) return;
  checking.add(view);
  queueMicrotask(() => {
    checking.delete(view);
    if (view.destroyed || countActive(view.root) < 2) return;
    warnedActive.add(view);
    warning(
      false,
      "More than one `<Camera3D active />` is visible in a `<View3D />`. The view draws from the last in tree order. " +
        "Set `active` on one camera only."
    );
  });
}

export function syncCamera(view: View3D): void {
  choose(view);
}

// `@pixi/3d` throws on each frame for a camera that left its view or is hidden, so the view switches in the same commit.
export function guardCamera(node: Container3D, leaving: boolean): void {
  const view = viewOf(node);
  if (view === undefined) return;
  const gone = leaving || !node.visible;
  if (
    (node instanceof Camera3D && node.parent === view.root) ||
    (gone && contains(node, view.camera)) ||
    hasActive(node)
  ) {
    choose(view, gone ? node : undefined);
  }
}

export function watchVisible(node: Container3D): void {
  if (watched.has(node)) return;
  watched.add(node);
  node.on("visibleChanged", () => guardCamera(node, false));
}

export function setActive(camera: Camera3D, active: boolean): void {
  if (activeCameras.has(camera) === active) return;
  if (active) activeCameras.add(camera);
  else activeCameras.delete(camera);
  const view = viewOf(camera);
  if (view !== undefined) choose(view);
}

// A child that joins a view chooses again when it is a direct camera or holds an active camera. A camera class that the
// app registers has no behavior of this adapter, so the view watches it.
function added(view: View3D, child: Container3D): void {
  if (child instanceof Camera3D) watchVisible(child);
  if (child instanceof Camera3D || hasActive(child)) syncCamera(view);
}

function withoutScene(props: Record<string, unknown>): Record<string, unknown> {
  const { camera, root, ...rest } = props;
  if (__DEV__ && camera !== undefined && !warnedCamera) {
    warnedCamera = true;
    warning(
      false,
      "`camera` is not a prop of `<View3D />`. Make a `<Camera3D />` a direct child, or assign `view.camera` through a ref."
    );
  }
  if (__DEV__ && root !== undefined && !warnedRoot) {
    warnedRoot = true;
    warning(false, "`root` is not a prop of `<View3D />`. The children of the element are the scene.");
  }
  return rest;
}

// The props that `create` passes to a constructor.
export function constructorOptions(props: Record<string, unknown>, names: readonly string[]): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  for (const name of names) {
    if (props[name] !== undefined) options[name] = props[name];
  }
  return options;
}

export function viewBehavior(constructorOnly: readonly string[]): Behavior<View3D, Record<string, unknown>> {
  return {
    appendChild: (view, child) => {
      check(child);
      view.root.addChild(child);
      added(view, child);
    },
    applyProps(view, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps === undefined ? undefined : withoutScene(oldProps), withoutScene(newProps));
      // A size restore calls `setSize`, which turns `autoResize` off, so the prop is written again last.
      if (newProps.autoResize === true) view.autoResize = true;
    },
    constructorOnly,
    create: props => {
      const view = new View3D(constructorOptions(props, constructorOnly));
      views.set(view.root, view);
      ownCameras.set(view, view.camera);
      return view;
    },
    insertBefore: (view, child, before) => {
      check(child);
      const index = view.root.getChildIndex(before as Container3D);
      const current = view.root.children.indexOf(child);
      // `addChildAt` takes a child out of its place before it inserts it.
      view.root.addChildAt(child, current !== -1 && current < index ? index - 1 : index);
      added(view, child);
    },
    // A node of this adapter moves the view off its camera in `beforeRemove`. A class that the app registers does not.
    removeChild: (view, child) => {
      const holdsCamera = contains(child as Container3D, view.camera);
      view.root.removeChild(child as Container3D);
      if (holdsCamera) choose(view);
    },
  };
}
