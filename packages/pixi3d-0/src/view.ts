import { Camera3D, Container3D, View3D } from "@pixi/3d";
import type { Behavior } from "react-pixi-fiber";
import warning from "./warning";

// The views this adapter created, by their root, and the camera each view had at creation or got from the fallback.
const views = new WeakMap<Container3D, View3D>();
const ownCameras = new WeakMap<View3D, Camera3D>();

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

// The last visible direct camera that is not the own camera and not in `skip`, else the own camera. An own camera
// that the app destroyed or moved out of the view is replaced by a new one, first in the root.
function choose(view: View3D, skip?: Container3D): void {
  let own = ownCameras.get(view)!;
  let camera: Camera3D | undefined;
  for (const child of view.root.children) {
    if (child instanceof Camera3D && child !== own && child.visible && !contains(skip, child)) camera = child;
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
}

export function syncCamera(view: View3D): void {
  choose(view);
}

// `@pixi/3d` throws on each frame for a camera that left its view or is hidden, so the view switches in the same commit.
export function guardCamera(node: Container3D, leaving: boolean): void {
  const view = viewOf(node);
  if (view === undefined) return;
  const gone = leaving || !node.visible;
  if ((node instanceof Camera3D && node.parent === view.root) || (gone && contains(node, view.camera))) {
    choose(view, gone ? node : undefined);
  }
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

export function viewBehavior(constructorOnly: readonly string[]): Behavior<View3D, Record<string, unknown>> {
  return {
    appendChild: (view, child) => {
      check(child);
      view.root.addChild(child);
      if (child instanceof Camera3D) syncCamera(view);
    },
    applyProps(view, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps === undefined ? undefined : withoutScene(oldProps), withoutScene(newProps));
      // A size restore calls `setSize`, which turns `autoResize` off, so the prop is written again last.
      if (newProps.autoResize === true) view.autoResize = true;
    },
    constructorOnly,
    create: props => {
      const options: Record<string, unknown> = {};
      for (const name of constructorOnly) {
        if (props[name] !== undefined) options[name] = props[name];
      }
      const view = new View3D(options);
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
      if (child instanceof Camera3D) syncCamera(view);
    },
    removeChild: (view, child) => {
      view.root.removeChild(child as Container3D);
    },
  };
}
