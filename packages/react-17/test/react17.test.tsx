import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { Component, StrictMode, Suspense } from "react";
import react17, { strictModeBit } from "../src/index";
import type { HostOps } from "react-pixi-fiber";

// Wraps the real reconciler so a test can see what reaches updateContainer.
const { createContainer, updateContainer } = vi.hoisted(() => ({ createContainer: vi.fn(), updateContainer: vi.fn() }));
vi.mock("react-reconciler", async importOriginal => {
  const Reconciler = ((await importOriginal()) as any).default;
  return {
    default: (config: unknown) => {
      const reconciler = Reconciler(config);
      updateContainer.mockImplementation(reconciler.updateContainer);
      createContainer.mockImplementation(reconciler.createContainer);
      return { ...reconciler, createContainer, updateContainer };
    },
  };
});

// A host tree of plain objects; enough to prove the reconciler is wired to hostOps.
function createFakeHostOps() {
  const validate = vi.fn();
  const mount = vi.fn();
  const ops: HostOps = {
    createInstance: (type, props) => ({ type, props, children: [] as any[], visible: true }),
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
    commitMount: mount,
    commitNewChildToFragmentInstance: () => {},
    createFragmentInstance: () => ({ children: [], getBounds: () => [], off: () => {}, on: () => {} }),
    deleteChildFromFragmentInstance: () => {},
  };
  return { ops, mount, validate };
}

// JSX host tags the fake host tree understands.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      node: any;
      leaf: any;
    }
  }
}

describe("react17", () => {
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
    createContainer.mockClear();
    updateContainer.mockClear();
  });

  it("exports the StrictMode bit for React 17", () => {
    expect(strictModeBit).toBe(1);
    expect(react17().strictModeBit).toBe(1);
  });

  it("builds one renderer per hostOps and kind and injects each into DevTools once", () => {
    const { ops } = createFakeHostOps();
    const primary = react17().createRenderer(ops, { isPrimaryRenderer: true });
    const secondary = react17().createRenderer(ops, { isPrimaryRenderer: false });
    expect(primary).not.toBe(secondary);
    expect(react17().createRenderer(ops, { isPrimaryRenderer: true })).toBe(primary);
    expect(react17().createRenderer(ops, { isPrimaryRenderer: false })).toBe(secondary);
    expect(hook.inject).toHaveBeenCalledTimes(2);
  });

  it("renders synchronously into the container through hostOps", () => {
    const { ops } = createFakeHostOps();
    const renderer = react17().createRenderer(ops, { isPrimaryRenderer: true });
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

  it("creates a legacy root", () => {
    const { ops } = createFakeHostOps();
    const container = { children: [] as any[] };
    react17()
      .createRenderer(ops, { isPrimaryRenderer: true })
      .render(<node />, container);
    expect(createContainer).toHaveBeenCalledWith(container, 0, false, null);
  });

  it("creates a concurrent root that commits synchronously", () => {
    const { ops } = createFakeHostOps();
    const renderer = react17({ root: "concurrent" }).createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    renderer.render(<node />, container);
    expect(createContainer).toHaveBeenCalledWith(container, 2, false, null);
    // No act(), no await: the child is there when render() returns.
    expect(container.children).toHaveLength(1);
    renderer.unmount(container);
    expect(container.children).toHaveLength(0);
  });

  it("puts the whole tree in strict mode on a concurrent root, as React 17 does", () => {
    const { ops, mount } = createFakeHostOps();
    const renderer = react17({ root: "concurrent" }).createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    renderer.render(<node />, container);
    expect((mount.mock.calls[0][3] as any).mode & strictModeBit).toBeTruthy();
    renderer.unmount(container);
  });

  it("throws on an unknown root", () => {
    expect(() => react17({ root: "blocking" as any })).toThrow(
      '`react17({ root })` got "blocking". Pass "concurrent" or "legacy", or leave `root` out.'
    );
  });

  it("passes the callback and parentComponent to updateContainer", () => {
    const { ops } = createFakeHostOps();
    const renderer = react17().createRenderer(ops, { isPrimaryRenderer: true });
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
    expect(updateContainer).toHaveBeenCalledWith(element, expect.anything(), parentComponent, callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("keeps the root after unmount, so a second unmount is a no-op that returns true and a new render reuses the root", () => {
    const { ops } = createFakeHostOps();
    const renderer = react17().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    renderer.render(<node />, container);
    expect(renderer.unmount(container)).toBe(true);
    expect(renderer.unmount(container)).toBe(true);
    expect(updateContainer).toHaveBeenCalledTimes(3);
    expect(updateContainer).toHaveBeenNthCalledWith(2, null, expect.anything(), null, null);
    expect(updateContainer).toHaveBeenNthCalledWith(3, null, expect.anything(), null, null);
    renderer.render(<node x={3} />, container);
    expect(container.children).toHaveLength(1);
    expect(container.children[0].props.x).toBe(3);
    expect(createContainer).toHaveBeenCalledTimes(1);
  });

  it("returns false without touching the reconciler when unmounting a container it never rendered into", () => {
    const { ops } = createFakeHostOps();
    const renderer = react17().createRenderer(ops, { isPrimaryRenderer: true });
    expect(renderer.unmount({ children: [] })).toBe(false);
    expect(updateContainer).not.toHaveBeenCalled();
  });

  it("injects into DevTools once per renderer", () => {
    const { ops } = createFakeHostOps();
    const renderer = react17().createRenderer(ops, { isPrimaryRenderer: false });
    renderer.render(<node />, { children: [] as any[] });
    renderer.render(<node />, { children: [] as any[] });
    expect(hook.inject).toHaveBeenCalledTimes(1);
    expect(hook.inject.mock.calls[0][0]).toMatchObject({
      rendererPackageName: "react-pixi-fiber",
      version: React.version,
    });
  });

  it("commits each new instance through commitMount with the fiber, so the core can find <StrictMode>", () => {
    const { ops, mount } = createFakeHostOps();
    const renderer = react17().createRenderer(ops, { isPrimaryRenderer: true });
    const container = { children: [] as any[] };
    renderer.render(
      <StrictMode>
        <node x={1} />
      </StrictMode>,
      container
    );
    expect(mount).toHaveBeenCalledWith(
      "node",
      container.children[0],
      { x: 1 },
      expect.objectContaining({ mode: expect.any(Number) })
    );
    expect(mount.mock.calls[0][3].mode & strictModeBit).toBe(strictModeBit);
  });

  describe.each(["legacy", "concurrent"] as const)("commitMount on a %s root", root => {
    const names = (mount: ReturnType<typeof vi.fn>) => mount.mock.calls.map(call => call[2].name);

    it("runs once per new instance, not for a move or an update", () => {
      const { ops, mount } = createFakeHostOps();
      const renderer = react17({ root }).createRenderer(ops, { isPrimaryRenderer: true });
      const container = { children: [] as any[] };
      renderer.render(
        <node name="parent">
          <leaf key="a" name="a" x={1} />
          <leaf key="b" name="b" x={1} />
        </node>,
        container
      );
      expect(names(mount)).toEqual(["a", "b", "parent"]);
      renderer.render(
        <node name="parent">
          <leaf key="b" name="b" x={2} />
          <leaf key="a" name="a" x={2} />
        </node>,
        container
      );
      expect(names(mount)).toEqual(["a", "b", "parent"]);
      renderer.unmount(container);
    });

    it("does not run for an instance of a render that React drops", () => {
      const { ops, mount } = createFakeHostOps();
      const renderer = react17({ root }).createRenderer(ops, { isPrimaryRenderer: true });
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      class Boundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
        state = { failed: false };
        static getDerivedStateFromError() {
          return { failed: true };
        }
        render() {
          return this.state.failed ? <leaf name="fallback" /> : <>{this.props.children}</>;
        }
      }
      function Throw(): null {
        throw new Error("drop this render");
      }
      renderer.render(
        <Boundary>
          <leaf name="dropped" />
          <Throw />
        </Boundary>,
        { children: [] }
      );
      expect(names(mount)).toEqual(["fallback"]);
      error.mockRestore();
    });

    it("runs once for an instance that mounts while a Suspense boundary waits", async () => {
      const { ops, mount } = createFakeHostOps();
      const renderer = react17({ root }).createRenderer(ops, { isPrimaryRenderer: true });
      const container = { children: [] as any[] };
      let resolve = () => {};
      let done = false;
      const promise = new Promise<void>(r => {
        resolve = () => {
          done = true;
          r();
        };
      });
      function Wait(): null {
        if (!done) throw promise;
        return null;
      }
      renderer.render(
        <Suspense fallback={<leaf name="fallback" />}>
          <leaf name="content" />
          <Wait />
        </Suspense>,
        container
      );
      resolve();
      // React throttles the reveal of a boundary that showed its fallback.
      const content = await vi.waitFor(() => {
        const found = container.children.find((child: any) => child.props.name === "content");
        if (!found || !found.visible) throw new Error("content is not revealed yet");
        return found;
      });
      const calls = mount.mock.calls.filter(call => call[2].name === "content");
      expect(calls).toHaveLength(1);
      expect(calls[0][1]).toBe(content);
      renderer.unmount(container);
    });
  });

  it("throws on text children", () => {
    const { ops } = createFakeHostOps();
    const renderer = react17().createRenderer(ops, { isPrimaryRenderer: true });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderer.render(<node>text</node>, { children: [] })).toThrow(/text instances/);
    error.mockRestore();
  });
});
