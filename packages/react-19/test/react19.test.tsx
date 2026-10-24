import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { Activity, Fragment, StrictMode, ViewTransition, startTransition, useState } from "react";
import react19, { strictModeBit } from "../src/index";
import type { HostOps, PixiFragmentInstance } from "react-pixi-fiber";
import {
  commitNewChildToFragmentInstance,
  createFragmentInstance,
  deleteChildFromFragmentInstance,
} from "../../react-pixi-fiber/src/hostOps";

// Wraps the real reconciler so a test can see what reaches updateContainerSync.
const { reconcilers, startViewTransitionSpies, updateContainerSync } = vi.hoisted(() => ({
  reconcilers: [] as any[],
  startViewTransitionSpies: [] as { mockRestore(): void; mock: { calls: unknown[][] } }[],
  updateContainerSync: vi.fn(),
}));
vi.mock("react-reconciler", async importOriginal => {
  const Reconciler = ((await importOriginal()) as any).default;
  return {
    default: (config: any) => {
      startViewTransitionSpies.push(vi.spyOn(config, "startViewTransition"));
      const reconciler = Reconciler(config);
      reconcilers.push(reconciler);
      updateContainerSync.mockImplementation(reconciler.updateContainerSync);
      return { ...reconciler, updateContainerSync };
    },
  };
});

// A host tree of plain objects; enough to prove the reconciler is wired to hostOps.
function createFakeHostOps() {
  const validate = vi.fn();
  const ops: HostOps = {
    createInstance: (type, props) => ({
      type,
      props,
      children: [] as any[],
      listeners: [] as [string, unknown][],
      visible: true,
      off(event: string, fn: unknown) {
        this.listeners = this.listeners.filter(([e, f]: [string, unknown]) => e !== event || f !== fn);
      },
      on(event: string, fn: unknown) {
        this.listeners.push([event, fn]);
      },
    }),
    appendChild: (parent, child) => {
      parent.children.push(child);
    },
    insertBefore: (parent, child, before) => {
      parent.children.splice(parent.children.indexOf(before), 0, child);
    },
    removeChild: (parent, child) => {
      parent.children.splice(parent.children.indexOf(child), 1);
    },
    clearContainer: container => {
      container.children.length = 0;
    },
    hideInstance: instance => {
      instance.visible = false;
    },
    unhideInstance: instance => {
      instance.visible = true;
    },
    setInitialProperties: (type, instance, props) => {
      instance.props = props;
    },
    diffProperties: (type, instance, prev, next) => (prev.x === next.x ? null : ["x", next.x]),
    updateProperties: (type, instance, payload, prev, next) => {
      instance.props = next;
    },
    validateProperties: validate,
    commitNewChildToFragmentInstance,
    createFragmentInstance,
    deleteChildFromFragmentInstance,
  };
  return { ops, validate };
}

// JSX host tags the fake host tree understands.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      node: any;
      leaf: any;
    }
  }
}

describe("react19", () => {
  let hook: { inject: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    hook = {
      inject: vi.fn(() => 1),
      supportsFiber: true,
      onCommitFiberRoot() {},
      onCommitFiberUnmount() {},
      checkDCE() {},
    } as any;
    (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
  });
  afterEach(() => {
    delete (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    updateContainerSync.mockClear();
  });

  it("exports the StrictMode bit for React 19", () => {
    expect(strictModeBit).toBe(8);
    expect(react19().strictModeBit).toBe(8);
  });

  it("builds one renderer per hostOps and kind and injects each into DevTools once", () => {
    const { ops } = createFakeHostOps();
    const primary = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const secondary = react19().createRenderer(ops, { isPrimaryRenderer: false });
    expect(primary).not.toBe(secondary);
    expect(react19().createRenderer(ops, { isPrimaryRenderer: true })).toBe(primary);
    expect(react19().createRenderer(ops, { isPrimaryRenderer: false })).toBe(secondary);
    expect(hook.inject).toHaveBeenCalledTimes(2);
  });

  it("renders synchronously into the container through hostOps", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    renderer.render(
      <node x={1}>
        <leaf />
      </node>,
      container
    );
    expect(container.children).toHaveLength(1);
    expect(container.children[0].type).toBe("node");
    expect(container.children[0].children[0].type).toBe("leaf");
    renderer.render(<node x={2} />, container);
    expect(container.children[0].props.x).toBe(2);
    expect(container.children[0].children).toHaveLength(0);
    renderer.unmount(container);
    expect(container.children).toHaveLength(0);
  });

  it("passes the callback and parentComponent to updateContainerSync", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    // The reconciler reads legacy context from parentComponent, so it must be a mounted class instance.
    class Parent extends React.Component {
      render() {
        return <node />;
      }
    }
    const parent = React.createRef<Parent>();
    renderer.render(<Parent ref={parent} />, { children: [] });
    const parentComponent = parent.current;
    const element = <node />;
    const callback = vi.fn();
    renderer.render(element, { children: [] }, callback, parentComponent);
    expect(updateContainerSync).toHaveBeenCalledWith(element, expect.anything(), parentComponent, callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("keeps the root after unmount, so a second unmount is a no-op that returns true and a new render reuses the root", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    renderer.render(<node />, container);
    expect(renderer.unmount(container)).toBe(true);
    expect(renderer.unmount(container)).toBe(true);
    expect(updateContainerSync).toHaveBeenCalledTimes(3);
    expect(updateContainerSync).toHaveBeenNthCalledWith(2, null, expect.anything(), null, null);
    expect(updateContainerSync).toHaveBeenNthCalledWith(3, null, expect.anything(), null, null);
    renderer.render(<node x={3} />, container);
    expect(container.children).toHaveLength(1);
    expect(container.children[0].props.x).toBe(3);
  });

  it("returns false without touching the reconciler when unmounting a container it never rendered into", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    expect(renderer.unmount({ children: [] })).toBe(false);
    expect(updateContainerSync).not.toHaveBeenCalled();
  });

  it("injects into DevTools once per renderer", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, {
      isPrimaryRenderer: false,
    });
    renderer.render(<node />, { children: [] as any[] });
    renderer.render(<node />, { children: [] as any[] });
    expect(hook.inject).toHaveBeenCalledTimes(1);
    expect(hook.inject.mock.calls[0][0]).toMatchObject({
      rendererPackageName: "react-pixi-fiber",
      version: React.version,
    });
  });

  it("commits synchronously on a concurrent root", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    renderer.render(<node />, container);
    // No act(), no await: the child is there when render() returns.
    expect(container.children).toHaveLength(1);
  });

  it("commits an update from a pointerdown handler in a microtask, as react-dom does", async () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    let setX: (x: number) => void = () => {};
    function Node() {
      const [x, set] = useState(1);
      setX = set;
      return <node x={x} />;
    }
    renderer.render(<Node />, container);
    const canvas = document.createElement("canvas");
    canvas.addEventListener("pointerdown", () => setX(2));
    canvas.dispatchEvent(new Event("pointerdown"));
    await Promise.resolve();
    expect(container.children[0].props.x).toBe(2);
    renderer.unmount(container);
  });

  it("skips updateProperties when the diff finds no change", () => {
    const { ops } = createFakeHostOps();
    const updateProperties = vi.spyOn(ops, "updateProperties");
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    renderer.render(<node x={1} />, container);
    renderer.render(<node x={1} />, container);
    expect(updateProperties).not.toHaveBeenCalled();
    renderer.render(<node x={2} />, container);
    expect(updateProperties).toHaveBeenCalledTimes(1);
  });

  it("renders and updates the children of a <ViewTransition> in a transition without animating", async () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const startViewTransition = startViewTransitionSpies[startViewTransitionSpies.length - 1];
    try {
      const container = { children: [] as any[] };
      let setX: (x: number) => void = () => {};
      const Scene = () => {
        const [x, setState] = React.useState(1);
        setX = setState;
        return (
          <ViewTransition>
            <node x={x} />
          </ViewTransition>
        );
      };
      renderer.render(<Scene />, container);
      expect(container.children[0].props.x).toBe(1);
      startTransition(() => setX(2));
      await vi.waitFor(() => expect(container.children[0].props.x).toBe(2));
      expect(startViewTransition.mock.calls.length).toBeGreaterThan(0);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
      startViewTransition.mockRestore();
    }
  });

  it("gives a Fragment ref the fragment's Display Objects and tracks added and removed ones", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const error = vi.spyOn(console, "error");
    try {
      const container = { children: [] as any[] };
      const ref = React.createRef<PixiFragmentInstance>();
      const Scene = ({ xs }: { xs: number[] }) => (
        <node>
          <Fragment ref={ref}>
            {xs.map(x => (
              <node key={x} x={x} />
            ))}
          </Fragment>
        </node>
      );
      renderer.render(<Scene xs={[1, 2]} />, container);
      expect(ref.current!.children.map(child => child.props.x)).toEqual([1, 2]);
      renderer.render(<Scene xs={[1, 3, 2]} />, container);
      expect(ref.current!.children.map(child => child.props.x)).toEqual([1, 3, 2]);
      renderer.render(<Scene xs={[3, 2]} />, container);
      expect(ref.current!.children.map(child => child.props.x)).toEqual([3, 2]);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("adds a Fragment ref's listener to a child the reconciler adds later", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    const ref = React.createRef<PixiFragmentInstance>();
    const Scene = ({ xs }: { xs: number[] }) => (
      <node>
        <Fragment ref={ref}>
          {xs.map(x => (
            <node key={x} x={x} />
          ))}
        </Fragment>
      </node>
    );
    const fn = () => {};
    renderer.render(<Scene xs={[1]} />, container);
    ref.current!.on("pointerdown", fn);
    renderer.render(<Scene xs={[1, 2]} />, container);
    expect(ref.current!.children.map(child => child.listeners)).toEqual([[["pointerdown", fn]], [["pointerdown", fn]]]);
    const [, second] = ref.current!.children;
    renderer.render(<Scene xs={[1]} />, container);
    expect(second.listeners).toEqual([]);
  });

  it("adds a Fragment ref's listener once to a child added while hidden and then revealed", async () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    const ref = React.createRef<PixiFragmentInstance>();
    const Scene = ({ mode, xs }: { mode: "hidden" | "visible"; xs: number[] }) => (
      <node>
        <Fragment ref={ref}>
          <Activity mode={mode}>
            {xs.map(x => (
              <node key={x} x={x} />
            ))}
          </Activity>
        </Fragment>
      </node>
    );
    const fn = () => {};
    renderer.render(<Scene mode="visible" xs={[1]} />, container);
    ref.current!.on("pointerdown", fn);
    renderer.render(<Scene mode="hidden" xs={[1]} />, container);
    expect(ref.current!.children).toEqual([]);
    renderer.render(<Scene mode="hidden" xs={[1, 2]} />, container);
    await vi.waitFor(() => expect(container.children[0].children).toHaveLength(2));
    renderer.render(<Scene mode="visible" xs={[1, 2]} />, container);
    expect(ref.current!.children.map(child => child.listeners)).toEqual([[["pointerdown", fn]], [["pointerdown", fn]]]);
  });

  it("gives a Fragment ref the Display Objects of a nested Fragment and of a portal", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    const portalContainer = { children: [] as any[] };
    const ref = React.createRef<PixiFragmentInstance>();
    renderer.render(
      <node>
        <Fragment ref={ref}>
          <node x={1} />
          <Fragment>
            <node x={2}>
              <node x={3} />
            </node>
          </Fragment>
          {reconcilers[reconcilers.length - 1].createPortal(<node x={4} />, portalContainer, null, null)}
        </Fragment>
      </node>,
      container
    );
    expect(ref.current!.children.map(child => child.props.x)).toEqual([1, 2, 4]);
    expect(portalContainer.children[0].props.x).toBe(4);
  });

  it("validates props with the fiber so the core can find <StrictMode>", () => {
    const { ops, validate } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    renderer.render(
      <StrictMode>
        <node x={1} />
      </StrictMode>,
      { children: [] }
    );
    if (__DEV__) {
      expect(validate).toHaveBeenCalledWith("node", { x: 1 }, expect.objectContaining({ mode: expect.any(Number) }));
      expect(validate.mock.calls[0][2].mode & strictModeBit).toBe(strictModeBit);
    } else {
      expect(validate).not.toHaveBeenCalled();
    }
  });

  it("reports text children on the console", () => {
    const { ops } = createFakeHostOps();
    const renderer = react19().createRenderer(ops, { isPrimaryRenderer: true });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    // An uncaught render error does not reach the caller of render(): the root reports it through onUncaughtError.
    renderer.render(<node>text</node>, { children: [] });
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/text instances/),
      })
    );
    error.mockRestore();
  });
});
