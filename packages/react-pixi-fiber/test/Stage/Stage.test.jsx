import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { createRef, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import renderer, { act } from "react-test-renderer";
import Stage from "../../src/Stage";
import { strictModeBit } from "@react-pixi-fiber/react-18";
import { createFakeApp, fakePixiAdapter } from "../utils/fakePixiAdapter";

// Stage renders through the configured secondary renderer; these spies stand in for it.
const { renderMock, unmountMock } = vi.hoisted(() => ({ renderMock: vi.fn(), unmountMock: vi.fn() }));

const adapter = fakePixiAdapter({ async: true });
const { apps } = adapter;
function makeApp() {
  const app = createFakeApp();
  app.renderer.resize = vi.fn();
  apps.push(app);
  return app;
}
let resolveInit;
// Each test holds the createApplication promise and resolves it with resolveInit.
adapter.createApplication = vi.fn();
adapter.destroyApplication = vi.fn(adapter.destroyApplication);
// The configured adapter; a test replaces it to reconfigure.
let configuredAdapter = adapter;
vi.mock("../../src/configure", () => ({
  getConfigured: () => ({ pixi: configuredAdapter, secondary: { render: renderMock, unmount: unmountMock } }),
  markRendered() {},
  getPixiAdapter: () => configuredAdapter,
  getStackAddendum: () => "",
  getStrictModeBit: () => strictModeBit,
}));

const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
const tick = () => act(() => new Promise(r => setTimeout(r, 0)));

describe("Stage", () => {
  beforeEach(() => {
    configuredAdapter = adapter;
    apps.length = 0;
    vi.clearAllMocks();
    vi.useRealTimers();
    adapter.createApplication.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveInit = () => resolve(makeApp());
        })
    );
  });
  afterEach(async () => {
    // Let the deferred destroy of an unmounted Stage (see cleanupStage) run before the next test clears the mocks.
    await new Promise(r => setTimeout(r, 0));
    vi.restoreAllMocks();
  });

  it("throws when the PixiJS adapter does not accept the provided app", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderer.create(<Stage app={{}} />)).toThrow(
      "Provided `app` has to be a PIXI.Application, or an object that the PixiJS adapter accepts as one"
    );
  });

  it("creates the application on the rendered canvas and renders children only after init", async () => {
    const onInit = vi.fn();
    const ref = createRef();
    const tree = renderer.create(<Stage ref={ref} options={{ width: 10, height: 20 }} onInit={onInit} />, {
      createNodeMock: () => ({ tagName: "CANVAS" }),
    });
    expect(adapter.createApplication).toHaveBeenCalledWith({ view: { tagName: "CANVAS" }, width: 10, height: 20 });
    expect(renderMock).not.toHaveBeenCalled();
    expect(onInit).not.toHaveBeenCalled();
    act(() => resolveInit());
    await flush();
    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(renderMock.mock.calls[0][1]).toBe(apps[0].stage);
    expect(onInit).toHaveBeenCalledWith(apps[0]);
    expect(ref.current._app.current).toBe(apps[0]);
    tree.unmount();
  });

  it("warns once in development when the application does not render to `options.canvas`", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const canvas = { tagName: "CANVAS" };
    const warnings = () => error.mock.calls.filter(c => /`options.canvas`/.test(c[0]));
    adapter.createApplication.mockImplementation(() => ({ ...makeApp(), canvas }));
    let tree = renderer.create(<Stage options={{ canvas }} />);
    await flush();
    expect(tree.toJSON()).toBeNull();
    expect(warnings()).toHaveLength(0);
    tree.unmount();
    adapter.createApplication.mockImplementation(() => ({ ...makeApp(), view: {} }));
    for (let i = 0; i < 2; i++) {
      tree = renderer.create(<Stage options={{ canvas }} />);
      await flush();
      tree.unmount();
    }
    expect(warnings()).toHaveLength(__DEV__ ? 1 : 0);
  });

  it("warns once in development when `app` changes after mount", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnings = () => error.mock.calls.filter(c => /`app` prop of `Stage` changed/.test(c[0]));
    const [first, second] = [makeApp(), makeApp()];
    const tree = renderer.create(<Stage app={first} />);
    await flush();
    act(() => tree.update(<Stage app={first} x={1} />));
    expect(warnings()).toHaveLength(0);
    act(() => tree.update(<Stage app={second} />));
    act(() => tree.update(<Stage app={first} />));
    expect(warnings()).toHaveLength(__DEV__ ? 1 : 0);
    tree.unmount();
  });

  it("_app.current is null while init is pending and warns once in development naming onInit", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const ref = createRef();
    const tree = renderer.create(<Stage ref={ref} />, { createNodeMock: () => ({}) });
    expect(ref.current._app.current).toBeNull();
    // A re-render rebuilds the ref object; the warning still fires once per Stage.
    tree.update(<Stage ref={ref} x={1} />);
    expect(ref.current._app.current).toBeNull();
    expect(error).toHaveBeenCalledTimes(__DEV__ ? 1 : 0);
    if (__DEV__) expect(error.mock.calls[0][0]).toMatch(/onInit/);
    act(() => resolveInit());
    await flush();
    tree.unmount();
  });

  it("unmounting while init is pending renders nothing, destroys the app on resolve and never calls onInit", async () => {
    const onInit = vi.fn();
    const tree = renderer.create(<Stage onInit={onInit} />, { createNodeMock: () => ({}) });
    tree.unmount();
    act(() => resolveInit());
    await flush();
    expect(renderMock).not.toHaveBeenCalled();
    expect(onInit).not.toHaveBeenCalled();
    expect(adapter.destroyApplication).toHaveBeenCalledWith(apps[0], false, true);
  });

  it("destroys the application with the adapter that created it after a reconfigure", async () => {
    const tree = renderer.create(<Stage />, { createNodeMock: () => ({}) });
    act(() => resolveInit());
    await flush();
    configuredAdapter = { ...adapter, destroyApplication: vi.fn() };
    tree.unmount();
    await tick();
    expect(adapter.destroyApplication).toHaveBeenCalledWith(apps[0], false, true);
    expect(configuredAdapter.destroyApplication).not.toHaveBeenCalled();
  });

  it("an options change while init is pending applies after init", async () => {
    const tree = renderer.create(<Stage options={{ width: 1, height: 1 }} x={1} />, { createNodeMock: () => ({}) });
    tree.update(<Stage options={{ width: 1, height: 1 }} x={2} />);
    act(() => resolveInit());
    await flush();
    expect(apps[0].stage.x).toBe(2);
    expect(adapter.createApplication).toHaveBeenCalledTimes(1);
    tree.unmount();
  });

  it("translates the props before splitting them, so a compat prop reaches app.stage and not the canvas", async () => {
    adapter.translateProps = (type, props) => {
      if (!("click" in props)) return props;
      const { click, ...rest } = props;
      return { ...rest, onclick: click };
    };
    try {
      const click = () => {};
      const tree = renderer.create(<Stage click={click} />, { createNodeMock: () => ({}) });
      expect(tree.toJSON().props).not.toHaveProperty("click");
      expect(tree.toJSON().props).not.toHaveProperty("onclick");
      act(() => resolveInit());
      await flush();
      expect(apps[0].stage.onclick).toBe(click);
      tree.unmount();
    } finally {
      delete adapter.translateProps;
    }
  });

  it("a StrictMode double mount leaves exactly one live application and calls onInit once", async () => {
    const onInit = vi.fn();
    const pending = [];
    adapter.createApplication.mockImplementation(() => new Promise(resolve => pending.push(() => resolve(makeApp()))));
    // React 18 double-invokes effects under StrictMode only on a concurrent root, and react-test-renderer 18
    // never does (it has no StrictEffectsMode), so this test mounts through react-dom's createRoot.
    const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const root = createRoot(document.createElement("div"));
    try {
      act(() => {
        root.render(
          <StrictMode>
            <Stage onInit={onInit} />
          </StrictMode>
        );
      });
      // The second mount creates its application on the same canvas once the first one is destroyed.
      expect(adapter.createApplication).toHaveBeenCalledTimes(1);
      act(() => pending[0]());
      await flush();
      expect(adapter.destroyApplication).toHaveBeenCalledTimes(1);
      expect(adapter.createApplication).toHaveBeenCalledTimes(2);
      act(() => pending[1]());
      await flush();
      expect(onInit).toHaveBeenCalledTimes(1);
      expect(adapter.destroyApplication).toHaveBeenCalledTimes(1);
      expect(apps.filter(a => !a.destroyed)).toHaveLength(1);
      act(() => root.unmount());
      await tick();
      expect(apps.filter(a => !a.destroyed)).toHaveLength(0);
    } finally {
      globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  });

  it("uses a provided app without destroying it, and unmounts its tree", async () => {
    const app = makeApp();
    const onInit = vi.fn();
    const tree = renderer.create(<Stage app={app} onInit={onInit} />, { createNodeMock: () => ({}) });
    expect(tree.toJSON()).toBeNull();
    await flush();
    expect(onInit).toHaveBeenCalledWith(app);
    expect(adapter.createApplication).not.toHaveBeenCalled();
    tree.unmount();
    await tick();
    expect(unmountMock).toHaveBeenCalledWith(app.stage);
    expect(adapter.destroyApplication).not.toHaveBeenCalled();
  });

  it("a size change while init is pending resizes the renderer after init", async () => {
    const onInit = vi.fn();
    const tree = renderer.create(<Stage options={{ width: 1, height: 1 }} onInit={onInit} />, {
      createNodeMock: () => ({}),
    });
    tree.update(<Stage options={{ width: 4, height: 5 }} onInit={onInit} />);
    act(() => resolveInit());
    await flush();
    expect(apps[0].renderer.resize).toHaveBeenCalledWith(4, 5);
    expect(adapter.createApplication).toHaveBeenCalledTimes(1);
    expect(onInit).toHaveBeenCalledWith(apps[0]);
    tree.unmount();
  });

  it("any other options change while init is pending recreates the application after init", async () => {
    const onInit = vi.fn();
    const tree = renderer.create(<Stage options={{ antialias: false }} onInit={onInit} />, {
      createNodeMock: () => ({}),
    });
    tree.update(<Stage options={{ antialias: true }} onInit={onInit} />);
    act(() => resolveInit());
    await flush();
    expect(adapter.createApplication).toHaveBeenCalledTimes(2);
    expect(adapter.createApplication).toHaveBeenLastCalledWith({ view: {}, antialias: true });
    expect(adapter.destroyApplication).toHaveBeenCalledWith(apps[0], false, false);
    act(() => resolveInit());
    await flush();
    // The first application was replaced before anyone could use it, so onInit only sees the second.
    expect(onInit.mock.calls).toEqual([[apps[1]]]);
    tree.unmount();
  });

  it("an options change while init is pending never renders into the application created with the old ones", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const tree = renderer.create(<Stage options={{ antialias: false }} />, { createNodeMock: () => ({}) });
    tree.update(<Stage options={{ antialias: true }} />);
    act(() => resolveInit());
    await flush();
    expect(renderMock).not.toHaveBeenCalled();
    expect(unmountMock).not.toHaveBeenCalled();
    expect(adapter.destroyApplication).toHaveBeenCalledWith(apps[0], false, false);
    act(() => resolveInit());
    await flush();
    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(renderMock.mock.calls[0][1]).toBe(apps[1].stage);
    expect(unmountMock).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    tree.unmount();
  });

  it("destroys the application created with outdated options once, when its canvas is replaced", async () => {
    const tree = renderer.create(<Stage options={{ antialias: false }} />, { createNodeMock: () => ({}) });
    tree.update(<Stage options={{ antialias: true }} />);
    act(() => resolveInit());
    await flush();
    expect(adapter.destroyApplication.mock.calls).toEqual([[apps[0], false, false]]);
    act(() => resolveInit());
    await flush();
    act(() => tree.unmount());
    await tick();
    expect(adapter.destroyApplication.mock.calls).toEqual([
      [apps[0], false, false],
      [apps[1], false, true],
    ]);
  });

  it("destroys the application created with outdated options once, when Stage unmounts before the new canvas", async () => {
    // A concurrent root, so the canvas swap is still pending when the unmount commits.
    const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const root = createRoot(document.createElement("div"));
    try {
      act(() => root.render(<Stage options={{ antialias: false }} />));
      act(() => root.render(<Stage options={{ antialias: true }} />));
      await act(async () => {
        resolveInit();
        await Promise.resolve();
        await Promise.resolve();
        expect(adapter.destroyApplication).not.toHaveBeenCalled();
        root.unmount();
      });
      await tick();
      expect(adapter.createApplication).toHaveBeenCalledTimes(1);
      expect(adapter.destroyApplication.mock.calls).toEqual([[apps[0], false, false]]);
    } finally {
      act(() => root.unmount());
      globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  });

  it("a rejected createApplication reaches an error boundary", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("no WebGL");
    adapter.createApplication.mockImplementation(() => Promise.reject(failure));
    class Boundary extends React.Component {
      state = { error: null };
      static getDerivedStateFromError(caught) {
        return { error: caught };
      }
      render() {
        return this.state.error ? null : this.props.children;
      }
    }
    const boundary = createRef();
    const onInit = vi.fn();
    const tree = renderer.create(
      <Boundary ref={boundary}>
        <Stage onInit={onInit} />
      </Boundary>,
      { createNodeMock: () => ({}) }
    );
    await flush();
    expect(boundary.current.state.error).toBe(failure);
    expect(onInit).not.toHaveBeenCalled();
    expect(renderMock).not.toHaveBeenCalled();
    tree.unmount();
    error.mockRestore();
  });

  it("a Stage prop that fails to apply reaches an error boundary and destroys the application it was not rendered to", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("alpha failed");
    adapter.createApplication.mockImplementation(() => {
      const app = makeApp();
      Object.defineProperty(app.stage, "alpha", {
        set() {
          throw failure;
        },
      });
      return Promise.resolve(app);
    });
    class Boundary extends React.Component {
      state = { error: null };
      static getDerivedStateFromError(caught) {
        return { error: caught };
      }
      render() {
        return this.state.error ? null : this.props.children;
      }
    }
    const boundary = createRef();
    const tree = renderer.create(
      <Boundary ref={boundary}>
        <Stage alpha={0.5} />
      </Boundary>,
      { createNodeMock: () => ({}) }
    );
    await flush();
    await tick();
    expect(boundary.current.state.error).toBe(failure);
    expect(renderMock).not.toHaveBeenCalled();
    expect(adapter.destroyApplication.mock.calls).toEqual([[apps[0], false, true]]);
    expect(error.mock.calls.flat().join(" ")).not.toContain("did not render into container");
    tree.unmount();
    error.mockRestore();
  });

  it("an onInit that throws reaches an error boundary", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("onInit failed");
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    class Boundary extends React.Component {
      state = { error: null };
      static getDerivedStateFromError(caught) {
        return { error: caught };
      }
      render() {
        return this.state.error ? null : this.props.children;
      }
    }
    const boundary = createRef();
    const tree = renderer.create(
      <Boundary ref={boundary}>
        <Stage
          onInit={() => {
            throw failure;
          }}
        />
      </Boundary>,
      { createNodeMock: () => ({}) }
    );
    act(() => resolveInit());
    await flush();
    await tick();
    process.off("unhandledRejection", unhandled);
    expect(boundary.current.state.error).toBe(failure);
    expect(unhandled).not.toHaveBeenCalled();
    tree.unmount();
    error.mockRestore();
  });

  it("resizes on a dimension change and recreates on any other options change", async () => {
    const onInit = vi.fn();
    const tree = renderer.create(<Stage options={{ width: 1, height: 1, antialias: false }} onInit={onInit} />, {
      createNodeMock: () => ({}),
    });
    act(() => resolveInit());
    await flush();
    tree.update(<Stage options={{ width: 2, height: 3, antialias: false }} onInit={onInit} />);
    expect(apps[0].renderer.resize).toHaveBeenCalledWith(2, 3);
    tree.update(<Stage options={{ width: 2, height: 3, antialias: true }} onInit={onInit} />);
    await tick();
    expect(adapter.createApplication).toHaveBeenCalledTimes(2);
    expect(adapter.destroyApplication).toHaveBeenCalledWith(apps[0], false, false);
    act(() => resolveInit());
    await flush();
    expect(renderMock.mock.calls.at(-1)[1]).toBe(apps[1].stage);
    // onInit fires once per created application, so a consumer gets the new reference after a recreate.
    expect(onInit.mock.calls).toEqual([[apps[0]], [apps[1]]]);
    tree.unmount();
  });

  it("recreates on an options change with `options.view` only after the old application is destroyed", async () => {
    const view = {};
    const tree = renderer.create(<Stage options={{ view, antialias: false }} />);
    act(() => resolveInit());
    await flush();
    act(() => tree.update(<Stage options={{ view, antialias: true }} />));
    expect(adapter.createApplication).toHaveBeenCalledTimes(1);
    await tick();
    expect(adapter.destroyApplication).toHaveBeenCalledWith(apps[0], false, false);
    expect(adapter.createApplication).toHaveBeenCalledTimes(2);
    expect(adapter.destroyApplication.mock.invocationCallOrder[0]).toBeLessThan(
      adapter.createApplication.mock.invocationCallOrder[1]
    );
    tree.unmount();
  });

  // The warned state is module-level, so each test loads a fresh Stage module.
  it("provides the bridged contexts inside the PixiJS tree and renders again when a value changes", async () => {
    const Theme = React.createContext("none");
    const Size = React.createContext(0);
    const Probe = () => `${React.useContext(Theme)}:${React.useContext(Size)}`;
    const App = ({ theme }) => (
      <Theme.Provider value={theme}>
        <Size.Provider value={1}>
          <Stage bridgeContexts={[Theme, Size]}>
            <Probe />
          </Stage>
        </Size.Provider>
      </Theme.Provider>
    );
    // The element handed to the secondary renderer, rendered on its own: only a bridged value can reach Probe.
    const rendered = () => renderer.create(renderMock.mock.calls.at(-1)[0]).toJSON();
    const tree = renderer.create(<App theme="light" />, { createNodeMock: () => ({ tagName: "CANVAS" }) });
    act(() => resolveInit());
    await flush();
    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(rendered()).toBe("light:1");
    act(() => tree.update(<App theme="dark" />));
    expect(renderMock).toHaveBeenCalledTimes(2);
    expect(rendered()).toBe("dark:1");
    expect(tree.toJSON().props.bridgeContexts).toBeUndefined();
    tree.unmount();
  });

  it("warns once about the deprecated width and height props", async () => {
    vi.resetModules();
    const { default: FreshStage } = await import("../../src/Stage");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const tree = renderer.create(<FreshStage width={1} height={1} />, { createNodeMock: () => ({}) });
    tree.update(<FreshStage width={2} height={2} />);
    expect(
      error.mock.calls.filter(c =>
        /`width` and `height` props of `Stage` are deprecated. They size `app.stage`, not the renderer.*They will be removed in 4\.0\.0\./.test(
          c[0]
        )
      )
    ).toHaveLength(__DEV__ ? 1 : 0);
    tree.unmount();
  });

  it("warns once when options are passed together with app", async () => {
    vi.resetModules();
    const { default: FreshStage } = await import("../../src/Stage");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = makeApp();
    const tree = renderer.create(<FreshStage app={app} options={{ width: 1 }} />, { createNodeMock: () => ({}) });
    tree.update(<FreshStage app={app} options={{ width: 2 }} />);
    expect(
      error.mock.calls.filter(c => /`options` prop of `Stage` has no effect when `app` is provided/.test(c[0]))
    ).toHaveLength(__DEV__ ? 1 : 0);
    await flush();
    tree.unmount();
  });

  it("destroys the application with `destroyOptions` on unmount", async () => {
    const tree = renderer.create(<Stage destroyOptions={{ children: true }} />, { createNodeMock: () => ({}) });
    act(() => resolveInit());
    await flush();
    tree.unmount();
    await tick();
    expect(adapter.destroyApplication.mock.calls).toEqual([[apps[0], false, { children: true }]]);
  });

  it("passes `destroyOptions={false}` as false", async () => {
    const tree = renderer.create(<Stage destroyOptions={false} />, { createNodeMock: () => ({}) });
    act(() => resolveInit());
    await flush();
    tree.unmount();
    await tick();
    expect(adapter.destroyApplication.mock.calls).toEqual([[apps[0], false, false]]);
  });

  it("uses the latest `destroyOptions` on unmount", async () => {
    const tree = renderer.create(<Stage destroyOptions={{ children: true }} />, { createNodeMock: () => ({}) });
    act(() => resolveInit());
    await flush();
    act(() => tree.update(<Stage destroyOptions={{ children: true, texture: false }} />));
    tree.unmount();
    await tick();
    expect(adapter.destroyApplication.mock.calls).toEqual([[apps[0], false, { children: true, texture: false }]]);
  });

  it("keeps false on a recreate when `destroyOptions` is set", async () => {
    const tree = renderer.create(<Stage destroyOptions={{ children: true }} options={{ antialias: false }} />, {
      createNodeMock: () => ({}),
    });
    act(() => resolveInit());
    await flush();
    tree.update(<Stage destroyOptions={{ children: true }} options={{ antialias: true }} />);
    await tick();
    expect(adapter.destroyApplication.mock.calls).toEqual([[apps[0], false, false]]);
    tree.unmount();
  });

  it("destroys a cancelled init with `destroyOptions`", async () => {
    const tree = renderer.create(<Stage destroyOptions={{ children: true }} />, { createNodeMock: () => ({}) });
    tree.unmount();
    act(() => resolveInit());
    await flush();
    expect(adapter.destroyApplication).toHaveBeenCalledWith(apps[0], false, { children: true });
  });

  it("destroys a failed init with true when `destroyOptions` is set", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    adapter.createApplication.mockImplementation(() => {
      const app = makeApp();
      Object.defineProperty(app.stage, "alpha", {
        set() {
          throw new Error("alpha failed");
        },
      });
      return Promise.resolve(app);
    });
    class Boundary extends React.Component {
      state = { error: null };
      static getDerivedStateFromError(caught) {
        return { error: caught };
      }
      render() {
        return this.state.error ? null : this.props.children;
      }
    }
    const tree = renderer.create(
      <Boundary>
        <Stage alpha={0.5} destroyOptions={{ children: true }} />
      </Boundary>,
      { createNodeMock: () => ({}) }
    );
    await flush();
    await tick();
    expect(adapter.destroyApplication.mock.calls).toEqual([[apps[0], false, true]]);
    tree.unmount();
    error.mockRestore();
  });

  it("warns once in development and does not destroy a provided app with `destroyOptions`", async () => {
    vi.resetModules();
    const { default: FreshStage } = await import("../../src/Stage");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = makeApp();
    const tree = renderer.create(<FreshStage app={app} destroyOptions={{ children: true }} />);
    act(() => tree.update(<FreshStage app={app} destroyOptions={false} />));
    await flush();
    tree.unmount();
    await tick();
    expect(
      error.mock.calls.filter(c => /`destroyOptions` and `onBeforeDestroy` props of `Stage` have no effect/.test(c[0]))
    ).toHaveLength(__DEV__ ? 1 : 0);
    expect(adapter.destroyApplication).not.toHaveBeenCalled();
  });
});
