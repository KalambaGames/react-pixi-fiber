import type { PixiAdapter } from "react-pixi-fiber";
import { DISPLAY_OBJECT_TAGS, FILTER_TAGS } from "../../src/tags";

function point(x = 0, y = 0) {
  return {
    x,
    y,
    copyFrom(p: { x: number; y: number }) {
      this.x = p.x;
      this.y = p.y;
    },
    set(nx: number, ny?: number) {
      this.x = nx;
      this.y = ny === undefined ? nx : ny;
    },
  };
}

type FakePoint = ReturnType<typeof point>;

export interface FakeNode {
  alpha: number;
  children: FakeNode[];
  destroyed: boolean;
  parent: FakeNode | null;
  position: FakePoint;
  rotation: number;
  scale: FakePoint;
  type: string;
  visible: boolean;
  x: number;
  y: number;
  addChild(child: FakeNode): void;
  addChildAt(child: FakeNode, index: number): void;
  destroy(): void;
  getChildIndex(child: FakeNode): number;
  removeChild(child: FakeNode): void;
  removeChildren(): void;
}

export function createFakeNode(type: string): FakeNode {
  const node: FakeNode = {
    alpha: 1,
    children: [],
    destroyed: false,
    parent: null,
    position: point(0, 0),
    rotation: 0,
    scale: point(1, 1),
    type,
    visible: true,
    x: 0,
    y: 0,
    addChild(child: FakeNode) {
      node.removeChild(child);
      child.parent = node;
      node.children.push(child);
    },
    addChildAt(child: FakeNode, index: number) {
      child.parent = node;
      node.children.splice(index, 0, child);
    },
    removeChild(child: FakeNode) {
      const i = node.children.indexOf(child);
      if (i !== -1) {
        node.children.splice(i, 1);
        child.parent = null;
      }
    },
    removeChildren() {
      for (const c of node.children) c.parent = null;
      node.children.length = 0;
    },
    getChildIndex(child: FakeNode) {
      return node.children.indexOf(child);
    },
    destroy() {
      node.destroyed = true;
      for (const c of node.children) c.destroy();
    },
  };
  return node;
}

export function createFakeApp() {
  return { stage: createFakeNode("Stage"), renderer: { resize: (_w: number, _h: number) => {} }, destroyed: false };
}

export function fakePixiAdapter({ async = false }: { async?: boolean } = {}) {
  const apps: ReturnType<typeof createFakeApp>[] = [];
  const components: PixiAdapter["components"] = {};
  for (const tag of Object.keys(DISPLAY_OBJECT_TAGS)) components[tag] = { create: () => createFakeNode(tag) };
  for (const tag of Object.keys(FILTER_TAGS)) components[tag] = { create: () => ({ type: tag }), kind: "filter" };
  const adapter: PixiAdapter & { apps: typeof apps } = {
    apps,
    components,
    properties: {
      boolean: ["visible"],
      callback: ["onclick"],
      numeric: ["rotation", "x", "y"],
      positiveNumeric: ["alpha"],
      untypedContainer: [],
      vector: ["position", "scale"],
    },
    isPoint: (value: any): value is { x: number; y: number } => value != null && typeof value.copyFrom === "function",
    copyPoint: (target: any, value) => target.copyFrom(value),
    createApplication: () => {
      const app = createFakeApp();
      apps.push(app);
      return async ? Promise.resolve(app) : app;
    },
    // Like PixiJS Application.destroy, which nulls `stage`: a test must not read app.stage after destroy.
    destroyApplication: (app: any) => {
      app.destroyed = true;
      app.stage = null;
    },
    isApplication: value => apps.includes(value as any),
  };
  return adapter;
}
