import { describe, it, expect, vi } from "vitest";
import React from "react";
import renderer from "react-test-renderer";
import * as PIXI from "pixi.js";
import { Container } from "../src/index";
import { usePixiApp, usePixiTicker } from "../src/hooks";
import { AppContext } from "../src/AppProvider";
import { render } from "../src/render";

// react-test-renderer is a secondary renderer, so the pixi renderer must be primary
// or both stamp the same context slot and React warns about multiple renderers.
describe("usePixiApp", () => {
  it("will provide app from the context above", () => {
    const app = new PIXI.Application();

    const TestComponent = vi.fn(() => null);

    const HookContainer = () => {
      const app = usePixiApp();

      return (
        <Container>
          <TestComponent app={app} />
        </Container>
      );
    };

    renderer.act(() => {
      render(
        <AppContext.Provider value={app}>
          <HookContainer />
        </AppContext.Provider>,
        app.stage
      );
    });

    expect(TestComponent).toHaveBeenCalledWith({ app }, {});
  });
});

describe("usePixiTicker", () => {
  it("will add the callback to the app.ticker", () => {
    const app = new PIXI.Application();
    const fn = vi.fn();
    const add = vi.spyOn(app.ticker, "add");

    const TestComponent = () => {
      usePixiTicker(fn);

      return <Container />;
    };

    const tree = renderer.create(
      <AppContext.Provider value={app}>
        <TestComponent />
      </AppContext.Provider>
    );

    // trigger useEffect because that's when usePixiTicker
    // calls `app.ticker.add`
    tree.update();

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(fn, undefined, undefined);
  });

  it("will remove the callback from the app.ticker as a cleanup", () => {
    const app = new PIXI.Application();
    const fn = vi.fn();
    const remove = vi.spyOn(app.ticker, "remove");

    const TestComponent = () => {
      usePixiTicker(fn);

      return <Container />;
    };

    const tree = renderer.create(
      <AppContext.Provider value={app}>
        <TestComponent />
      </AppContext.Provider>
    );

    // trigger useEffect cleanup because that's when usePixiTicker
    // calls `app.ticker.remove`
    renderer.act(() => {
      tree.unmount();
    });

    expect(remove).toHaveBeenCalledWith(fn);
  });

  it("will not add the callback while enabled is false", () => {
    const app = new PIXI.Application();
    const fn = vi.fn();
    const add = vi.spyOn(app.ticker, "add");

    const TestComponent = () => {
      usePixiTicker(fn, { enabled: false });

      return <Container />;
    };

    const tree = renderer.create(
      <AppContext.Provider value={app}>
        <TestComponent />
      </AppContext.Provider>
    );

    tree.update();

    expect(add).not.toHaveBeenCalled();
  });

  it("will remove the callback when enabled turns false and add it back when enabled turns true", () => {
    const app = new PIXI.Application();
    const fn = vi.fn();
    const add = vi.spyOn(app.ticker, "add");
    const remove = vi.spyOn(app.ticker, "remove");

    const TestComponent = ({ enabled }) => {
      usePixiTicker(fn, { enabled });

      return <Container />;
    };
    const element = enabled => (
      <AppContext.Provider value={app}>
        <TestComponent enabled={enabled} />
      </AppContext.Provider>
    );

    let tree;
    renderer.act(() => {
      tree = renderer.create(element(true));
    });

    expect(add).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();

    renderer.act(() => {
      tree.update(element(false));
    });

    expect(add).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(fn);

    renderer.act(() => {
      tree.update(element(true));
    });

    expect(add).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("will pass priority to the app.ticker", () => {
    const app = new PIXI.Application();
    const fn = vi.fn();
    const add = vi.spyOn(app.ticker, "add");

    const TestComponent = () => {
      usePixiTicker(fn, { priority: PIXI.UPDATE_PRIORITY.HIGH });

      return <Container />;
    };

    const tree = renderer.create(
      <AppContext.Provider value={app}>
        <TestComponent />
      </AppContext.Provider>
    );

    tree.update();

    expect(add).toHaveBeenCalledWith(fn, undefined, PIXI.UPDATE_PRIORITY.HIGH);
  });

  it("throws when the app has no ticker", () => {
    const TestComponent = () => {
      usePixiTicker(vi.fn());

      return null;
    };
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      renderer.create(
        <AppContext.Provider value={{ stage: new PIXI.Container() }}>
          <TestComponent />
        </AppContext.Provider>
      )
    ).toThrow(
      expect.objectContaining({
        message: "`usePixiTicker` needs an `app` with a `ticker`.",
        name: "Invariant Violation",
      })
    );
    error.mockRestore();
  });
});

describe("usePixiApp outside of Stage", () => {
  it("throws an invariant violation", () => {
    const TestComponent = () => {
      usePixiApp();

      return null;
    };
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderer.create(<TestComponent />)).toThrow(
      expect.objectContaining({ message: expect.stringMatching(/children of <Stage \/>/), name: "Invariant Violation" })
    );
    error.mockRestore();
  });
});
