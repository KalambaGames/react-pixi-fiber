import { describe, it, expect, vi } from "vitest";
import React, { createRef, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-test-renderer";
import * as PIXI from "pixi.js";
import { PIXIFilter, render, Sprite, Stage, unmount } from "../src/index";

// Each instance gets its own `destroy` spy, so a test can tell the instances apart.
const Blur = PIXIFilter("TestBlur", () => {
  const filter = new PIXI.filters.BlurFilter();
  vi.spyOn(filter, "destroy");
  return filter;
});

const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

describe("filter children", () => {
  it("renders a filter child into parent.filters and destroys it on unmount", () => {
    const stage = new PIXI.Container();
    const ref = createRef();
    act(() =>
      render(
        <Sprite>
          <Blur ref={ref} />
        </Sprite>,
        stage
      )
    );
    const filter = ref.current;
    expect(stage.children[0].filters).toHaveLength(1);
    expect(stage.children[0].filters[0]).toBe(filter);
    act(() => unmount(stage));
    expect(filter.destroy).toHaveBeenCalledTimes(1);
  });

  it("reorders filters with the JSX order", () => {
    const stage = new PIXI.Container();
    const a = createRef();
    const b = createRef();
    act(() =>
      render(
        <Sprite>
          <Blur key="a" ref={a} />
          <Blur key="b" ref={b} />
        </Sprite>,
        stage
      )
    );
    const [first, second] = [a.current, b.current];
    act(() =>
      render(
        <Sprite>
          <Blur key="b" ref={b} />
          <Blur key="a" ref={a} />
        </Sprite>,
        stage
      )
    );
    const { filters } = stage.children[0];
    expect(filters).toHaveLength(2);
    expect(filters[0]).toBe(second);
    expect(filters[1]).toBe(first);
    expect(first.destroy).not.toHaveBeenCalled();
    expect(second.destroy).not.toHaveBeenCalled();
    act(() => unmount(stage));
  });

  it("recreates the filter on a key change", () => {
    const stage = new PIXI.Container();
    const ref = createRef();
    act(() =>
      render(
        <Sprite>
          <Blur key="1" ref={ref} />
        </Sprite>,
        stage
      )
    );
    const old = ref.current;
    act(() =>
      render(
        <Sprite>
          <Blur key="2" ref={ref} />
        </Sprite>,
        stage
      )
    );
    expect(ref.current).not.toBe(old);
    expect(old.destroy).toHaveBeenCalledTimes(1);
    expect(stage.children[0].filters).toHaveLength(1);
    expect(stage.children[0].filters[0]).toBe(ref.current);
    act(() => unmount(stage));
  });

  it("keeps a live filter under StrictMode", async () => {
    // React 18 remounts under StrictMode only on a concurrent root, so react-dom's createRoot hosts the Stage.
    const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const app = new PIXI.Application();
    const ref = createRef();
    const root = createRoot(document.createElement("div"));
    try {
      act(() =>
        root.render(
          <StrictMode>
            <Stage app={app}>
              <Sprite>
                <Blur ref={ref} />
              </Sprite>
            </Stage>
          </StrictMode>
        )
      );
      await flush();
      const filter = ref.current;
      expect(filter).toBeInstanceOf(PIXI.filters.BlurFilter);
      expect(app.stage.children).toHaveLength(1);
      expect(app.stage.children[0].filters).toHaveLength(1);
      expect(app.stage.children[0].filters[0]).toBe(filter);
      expect(filter.destroy).not.toHaveBeenCalled();
      act(() => root.unmount());
      expect(filter.destroy).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
      app.destroy();
    }
  });

  it("disables a filter while a Suspense fallback shows and re-enables it after", async () => {
    let resolve;
    let resolved = false;
    const promise = new Promise(r => {
      resolve = () => {
        resolved = true;
        r();
      };
    });
    const Suspending = () => {
      if (!resolved) throw promise;
      return <Sprite />;
    };
    const stage = new PIXI.Container();
    const ref = createRef();
    act(() =>
      render(
        <Sprite>
          <Suspense fallback={null}>
            <Blur enabled ref={ref} />
            <Suspending />
          </Suspense>
        </Sprite>,
        stage
      )
    );
    const parent = stage.children[0];
    const filter = ref.current;
    expect(parent.filters).toHaveLength(1);
    expect(parent.filters[0]).toBe(filter);
    expect(filter.enabled).toBe(false);
    await act(async () => {
      resolve();
      await promise;
    });
    expect(parent.filters).toHaveLength(1);
    expect(parent.filters[0]).toBe(filter);
    expect(filter.enabled).toBe(true);
    expect(filter.destroy).not.toHaveBeenCalled();
    act(() => unmount(stage));
  });

  it("filters the root container when rendered at the top level", () => {
    const stage = new PIXI.Container();
    const ref = createRef();
    act(() => render(<Blur ref={ref} />, stage));
    expect(stage.filters).toHaveLength(1);
    expect(stage.filters[0]).toBe(ref.current);
    act(() => unmount(stage));
    expect(stage.filters).toBeNull();
  });

  it("throws when a filter child mounts on an object that keeps its filters prop", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const stage = new PIXI.Container();
      const filters = [new PIXI.filters.BlurFilter()];
      act(() => render(<Sprite filters={filters} />, stage));
      expect(() =>
        act(() =>
          render(
            <Sprite filters={filters}>
              <Blur />
            </Sprite>,
            stage
          )
        )
      ).toThrow("has both a `filters` prop and filter children");
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("throws when an object switches from the filters prop to a filter child in one render", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const stage = new PIXI.Container();
      act(() => render(<Sprite filters={[new PIXI.filters.BlurFilter()]} />, stage));
      expect(() =>
        act(() =>
          render(
            <Sprite>
              <Blur />
            </Sprite>,
            stage
          )
        )
      ).toThrow("has both a `filters` prop and filter children");
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("switches from the filters prop to a filter child under a new key", () => {
    const stage = new PIXI.Container();
    act(() => render(<Sprite filters={[new PIXI.filters.BlurFilter()]} key="prop" />, stage));
    act(() =>
      render(
        <Sprite key="child">
          <Blur />
        </Sprite>,
        stage
      )
    );
    expect(stage.children[0].filters).toHaveLength(1);
    act(() => render(<Sprite key="child" />, stage));
    expect(stage.children[0].filters).toBeNull();
    act(() => unmount(stage));
  });

  it("throws on mount when an object has both a filters prop and filter children", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const stage = new PIXI.Container();
      expect(() =>
        act(() =>
          render(
            <Sprite filters={[new PIXI.filters.BlurFilter()]}>
              <Blur />
            </Sprite>,
            stage
          )
        )
      ).toThrow("has both a `filters` prop and filter children");
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("throws on update when a filters prop is added beside filter children", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const stage = new PIXI.Container();
      act(() =>
        render(
          <Sprite>
            <Blur />
          </Sprite>,
          stage
        )
      );
      expect(() =>
        act(() =>
          render(
            <Sprite filters={[new PIXI.filters.BlurFilter()]}>
              <Blur />
            </Sprite>,
            stage
          )
        )
      ).toThrow("has both a `filters` prop and filter children");
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
