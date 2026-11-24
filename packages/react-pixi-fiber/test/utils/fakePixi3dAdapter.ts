import type { Pixi3dAdapter } from "react-pixi-fiber";
import { createFakeNode, point } from "./fakePixiAdapter";
import type { FakeNode } from "./fakePixiAdapter";

function vector(x = 0, y = 0, z = 0) {
  return {
    x,
    y,
    z,
    set(nx: number, ny: number, nz: number) {
      this.x = nx;
      this.y = ny;
      this.z = nz;
    },
  };
}

type FakeVector = ReturnType<typeof vector>;

export type FakeNode3d = Omit<FakeNode, "position" | "rotation" | "scale"> & {
  anchor: ReturnType<typeof point>;
  is3d: true;
  position: FakeVector;
  rotation: FakeVector;
  scale: FakeVector;
};

export type FakeView = FakeNode & { root: FakeNode3d };

export function createFakeNode3d(type: string): FakeNode3d {
  const { position, rotation, scale, ...node } = createFakeNode(type);
  return { ...node, anchor: point(), is3d: true, position: vector(), rotation: vector(), scale: vector(1, 1, 1) };
}

const COORDINATES = ["x", "y", "z"];

function isVector(value: any): value is FakeVector {
  return value != null && typeof value.x === "number" && typeof value.y === "number" && typeof value.set === "function";
}

export function fakePixi3dAdapter({ defaults }: { defaults?: Pixi3dAdapter["defaults"] } = {}): Pixi3dAdapter {
  return {
    behaviors: {
      Node3D: { create: () => createFakeNode3d("Node3D") },
      View: {
        create: () => {
          const view = createFakeNode("View") as FakeView;
          view.root = createFakeNode3d("Root");
          return view;
        },
        appendChild: (parent: FakeView, child: FakeNode3d) => parent.root.addChild(child as any),
        insertBefore: (parent: FakeView, child: FakeNode3d, before: FakeNode3d) => {
          parent.root.removeChild(child as any);
          parent.root.addChildAt(child as any, parent.root.getChildIndex(before as any));
        },
        removeChild: (parent: FakeView, child: FakeNode3d) => parent.root.removeChild(child as any),
      },
    },
    defaults,
    properties: {
      boolean: ["visible"],
      callback: ["onclick"],
      numeric: ["x", "y"],
      positiveNumeric: [],
      untypedContainer: [],
      vector: ["anchor", "position", "rotation", "scale"],
    },
    isNode: (value: any) => value != null && value.is3d === true,
    isPoint: isVector,
    clonePoint: (point: any) =>
      typeof point.z === "number" ? { x: point.x, y: point.y, z: point.z } : { x: point.x, y: point.y },
    setPoint: (instance: any, propName, value) => {
      const target = instance[propName];
      const names = COORDINATES.filter(name => typeof target[name] === "number");
      let coordinates: number[];
      if (Array.isArray(value)) {
        if (value.length !== names.length) return false;
        coordinates = value;
      } else if (typeof value === "number") {
        coordinates = names.map(() => value);
      } else if (
        value != null &&
        typeof value === "object" &&
        names.every(name => typeof (value as any)[name] === "number")
      ) {
        coordinates = names.map(name => (value as any)[name]);
      } else return false;
      if (coordinates.some(c => typeof c !== "number")) return false;
      names.forEach((name, i) => (target[name] = coordinates[i]));
      return true;
    },
  };
}
