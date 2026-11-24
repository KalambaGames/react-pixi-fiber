import { Container3D } from "@pixi/3d";
import type { Destroy3DOptions } from "@pixi/3d";
import type { FPSCamera, OrbitCamera } from "@pixi/3d/extras";
import type { Behavior } from "react-pixi-fiber";
import { clonePoint, hasSetter, parseCoordinates } from "./points";
import { viewOf } from "./view";

type Controller = FPSCamera | OrbitCamera;
type ControllerClass = typeof FPSCamera | typeof OrbitCamera;
type Vector = { x: number; y: number; z: number; set(x: number, y: number, z: number): unknown };

// The element of a controller: a node with no content in the root of a view. It is destroyed with the view, so the
// controller goes with it.
export class ControllerNode<C extends { destroy(): void }> extends Container3D {
  controller: C | null = null;

  destroy(options?: Destroy3DOptions): void {
    this.controller?.destroy();
    this.controller = null;
    super.destroy(options);
  }
}

type Node = ControllerNode<Controller>;

// The props of each node, and the value each written prop had on the controller before its first write.
const kept = new WeakMap<Node, { defaults: Record<string, unknown>; props: Record<string, unknown> }>();

const isVector = (value: any): value is Vector =>
  typeof value?.x === "number" && typeof value.y === "number" && typeof value.z === "number";

const isObject = (value: unknown): value is object => typeof value === "object" && value !== null;

// A vector goes through its setter when it has one, as `up` does, else in place, as the read-only `target`. A value
// that is not a vector leaves it unchanged. An object, as `mouseButtons`, takes a part: the rest keeps its default.
function write(controller: Controller, defaults: Record<string, unknown>, name: string, value: unknown): void {
  const target = controller as unknown as Record<string, unknown>;
  const current = target[name];
  if (!(name in defaults)) {
    defaults[name] = isVector(current) ? clonePoint(current) : isObject(current) ? { ...current } : current;
  }
  const next = value === undefined ? defaults[name] : value;
  if (!isVector(current)) {
    target[name] = isObject(current) && isObject(next) ? { ...(defaults[name] as object), ...next } : next;
    return;
  }
  const coordinates = parseCoordinates(next, 3);
  if (coordinates === null) return;
  const [x, y, z] = coordinates;
  if (hasSetter(target, name)) target[name] = { x, y, z };
  else current.set(x, y, z);
}

// A hidden controller is off. `enabled` is written only here.
function enable(node: Node): void {
  node.controller!.enabled = node.visible && ((kept.get(node)!.props.enabled as boolean | undefined) ?? true);
}

function update(node: Node, oldProps: Record<string, unknown> | undefined, newProps: Record<string, unknown>): void {
  const { defaults } = kept.get(node)!;
  for (const name of new Set([...Object.keys(oldProps ?? {}), ...Object.keys(newProps)])) {
    if (name === "children" || name === "enabled" || name === "view") continue;
    if (oldProps?.[name] !== newProps[name]) write(node.controller!, defaults, name, newProps[name]);
  }
  enable(node);
}

export function controllerBehavior(
  tag: "FPSCamera" | "OrbitCamera",
  Class: ControllerClass | undefined
): Behavior<Node, Record<string, unknown>> {
  return {
    afterAdd: node => {
      const view = viewOf(node);
      if (view === undefined || node.parent !== view.root) {
        throw new Error(`\`<${tag} />\` must be a direct child of \`<View3D />\`.`);
      }
      node.controller = new Class!({ view });
      update(node, undefined, kept.get(node)!.props);
      node.on("visibleChanged", () => enable(node));
    },
    applyProps: (node, oldProps, newProps) => {
      kept.get(node)!.props = newProps;
      if (node.controller !== null) update(node, oldProps, newProps);
    },
    create: () => {
      if (Class === undefined) {
        throw new Error(`\`${tag}\` is not in \`pixi3d0({ extras })\`. Add \`${tag}\` from \`@pixi/3d/extras\` to it.`);
      }
      const node: Node = new ControllerNode();
      kept.set(node, { defaults: {}, props: {} });
      return node;
    },
  };
}
