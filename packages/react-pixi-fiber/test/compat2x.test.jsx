import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { StrictMode } from "react";
import renderer, { act } from "react-test-renderer";
import * as PIXI from "pixi.js";
import {
  AppContext,
  AppProvider,
  Container,
  CustomPIXIComponent,
  CustomPIXIProperty,
  NineSlicePlane,
  Sprite,
  applyDisplayObjectProps,
  applyProps,
  createStageClass,
  render,
  unmount,
  usePixiApp,
  usePixiTicker,
  withApp,
} from "../src/index";
import pixi6 from "@react-pixi-fiber/pixi-6";
import { registerAdapterComponents } from "../src/registry";

// 2.x code, unchanged, against react-18 and pixi-6. The deprecation warnings are module-level once guards, and this
// file is the first in its module graph to use each deprecated name.
const settle = () =>
  act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });
const messages = error => error.mock.calls.map(call => String(call[0]));
const countMatching = (error, pattern) => messages(error).filter(message => pattern.test(message)).length;

describe("2.x compatibility", () => {
  let error;
  beforeEach(() => {
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("renders a CustomPIXIComponent with the custom* keys and CustomPIXIProperty, warning once each", () => {
    const calls = [];
    const behavior = {
      customDisplayObject: props => {
        calls.push(["create", props.radius]);
        return new PIXI.Graphics();
      },
      customApplyProps(instance, oldProps, newProps) {
        // 2.x passes `undefined` as the old props on the first apply.
        calls.push(["applyProps", oldProps?.radius, newProps.radius]);
        applyDisplayObjectProps("Graphics", instance, oldProps, newProps);
      },
      customDidAttach: instance => calls.push(["didAttach", instance.parent !== null]),
      customWillDetach: instance => calls.push(["willDetach", instance.parent !== null]),
    };
    const Circle = CustomPIXIComponent(behavior, "CompatCircle");
    const Ring = CustomPIXIComponent(() => new PIXI.Graphics(), "CompatRing");
    CustomPIXIProperty("CompatCircle", "radius", value => typeof value === "number");
    CustomPIXIProperty("CompatRing", "width");
    expect(Circle).toBe("CompatCircle");
    expect(Ring).toBe("CompatRing");

    const stage = new PIXI.Container();
    render(
      <StrictMode>
        <Circle radius={1} x={2} />
      </StrictMode>,
      stage
    );
    const circle = stage.children[0];
    expect(circle).toBeInstanceOf(PIXI.Graphics);
    // applyDisplayObjectProps inside customApplyProps sets the plain Graphics props.
    expect(circle.x).toBe(2);

    render(
      <StrictMode>
        <Circle radius="big" x={3} />
      </StrictMode>,
      stage
    );
    expect(stage.children[0]).toBe(circle);
    expect(circle.x).toBe(3);
    // 3.0.0 does not write the 2.x fields onto the instance; applyProps replaces them.
    expect(circle._customApplyProps).toBeUndefined();
    applyProps(circle, {}, { radius: 4, x: 5 });
    expect(circle.x).toBe(5);

    unmount(stage);
    expect(stage.children).toHaveLength(0);
    // StrictMode renders the component twice in development, so read the distinct calls in order.
    const distinct = calls.filter((call, i) => i === 0 || JSON.stringify(call) !== JSON.stringify(calls[i - 1]));
    expect(distinct).toEqual([
      ["create", 1],
      ["applyProps", undefined, 1],
      ["didAttach", true],
      ["applyProps", 1, "big"],
      ["applyProps", undefined, 4],
      ["willDetach", true],
    ]);

    const dev = __DEV__ ? 1 : 0;
    expect(countMatching(error, /`CustomPIXIComponent\(behavior, type\)` is deprecated/)).toBe(dev);
    expect(countMatching(error, /`CustomPIXIProperty` is deprecated/)).toBe(dev);
    for (const key of ["customDisplayObject", "customApplyProps", "customDidAttach", "customWillDetach"]) {
      expect(countMatching(error, new RegExp(`Behavior key \`${key}\` on \`CompatCircle\` is deprecated`))).toBe(dev);
    }
    // The CustomPIXIProperty validator still runs under StrictMode.
    expect(countMatching(error, /Invalid value for prop `radius` on `<CompatCircle \/>`/)).toBe(dev);
  });

  it("renders NineSlicePlane from pixi-6 without a warning", () => {
    const stage = new PIXI.Container();
    render(<NineSlicePlane texture={PIXI.Texture.WHITE} leftWidth={1} />, stage);
    expect(stage.children[0]).toBeInstanceOf(PIXI.NineSlicePlane);
    expect(stage.children[0].leftWidth).toBe(1);
    unmount(stage);
    expect(messages(error).filter(message => /NineSlicePlane/.test(message))).toEqual([]);
  });

  it("renders NineSlicePlane as NineSliceSprite when the adapter has no NineSlicePlane, warning once", () => {
    const dev = __DEV__ ? 1 : 0;
    const { NineSlicePlane: _, ...components } = pixi6().components;
    registerAdapterComponents(components);
    try {
      const stage = new PIXI.Container();
      render(
        <>
          <NineSlicePlane texture={PIXI.Texture.WHITE} leftWidth={1} />
          <NineSlicePlane texture={PIXI.Texture.WHITE} leftWidth={2} />
        </>,
        stage
      );
      expect(stage.children[0]).toBeInstanceOf(PIXI.NineSlicePlane);
      expect(stage.children.map(child => child.leftWidth)).toEqual([1, 2]);
      unmount(stage);
      expect(countMatching(error, /Tag `NineSlicePlane` is deprecated, use `NineSliceSprite`/)).toBe(dev);
    } finally {
      registerAdapterComponents(pixi6().components);
    }
  });

  it("renders the Stage from createStageClass with width and height, warning once each", async () => {
    const Stage = createStageClass();
    const LegacyStage = createStageClass();
    expect(LegacyStage).toBe(Stage);
    const width = vi.spyOn(PIXI.Container.prototype, "width", "set");
    const height = vi.spyOn(PIXI.Container.prototype, "height", "set");
    // The values the setter received with app.stage as `this`.
    const setOnStage = spy =>
      spy.mock.calls.filter((_, i) => spy.mock.contexts[i] === app.stage).map(([value]) => value);
    let app = null;
    const tree = renderer.create(
      <Stage
        width={32}
        height={32}
        onInit={a => {
          app = a;
        }}
      >
        <Sprite texture={PIXI.Texture.WHITE} />
      </Stage>,
      { createNodeMock: () => document.createElement("canvas") }
    );
    await settle();
    expect(app).not.toBeNull();
    expect(app.stage.children[0]).toBeInstanceOf(PIXI.Sprite);
    // As in 2.x, the props reach app.stage, not the renderer or the canvas.
    expect(setOnStage(width)).toEqual([32]);
    expect(setOnStage(height)).toEqual([32]);
    act(() => tree.update(<Stage width={16} height={16} onInit={() => {}} />));
    expect(setOnStage(width)).toEqual([32, 16]);
    expect(setOnStage(height)).toEqual([32, 16]);
    act(() => tree.unmount());
    await settle();

    const dev = __DEV__ ? 1 : 0;
    expect(countMatching(error, /`createStageClass` is deprecated/)).toBe(dev);
    expect(countMatching(error, /`width` and `height` props of `Stage` are deprecated/)).toBe(dev);
  });

  it("provides the application through AppProvider, withApp, usePixiApp and usePixiTicker", () => {
    const app = new PIXI.Application();
    const tick = vi.fn();
    const add = vi.spyOn(app.ticker, "add");
    const seen = [];
    const WithApp = withApp(({ app }) => {
      seen.push(["withApp", app]);
      return null;
    });
    const WithHooks = () => {
      seen.push(["usePixiApp", usePixiApp()]);
      usePixiTicker(tick);
      return null;
    };
    // The Stage test above renders AppContext through the secondary renderer, the slot react-test-renderer also uses,
    // so this tree renders through the primary one.
    act(() => {
      render(
        <AppProvider app={app}>
          <WithApp />
          <WithHooks />
          <AppContext.Consumer>{value => (seen.push(["AppContext", value]), null)}</AppContext.Consumer>
        </AppProvider>,
        app.stage
      );
    });
    expect(seen).toEqual([
      ["withApp", app],
      ["usePixiApp", app],
      ["AppContext", app],
    ]);
    expect(add).toHaveBeenCalledWith(tick);
    act(() => unmount(app.stage));
    app.destroy();
    expect(messages(error)).toEqual([]);
  });

  it("renders into and unmounts from a Container", () => {
    const stage = new PIXI.Container();
    const callback = vi.fn();
    render(
      <Container name="root">
        <Sprite />
      </Container>,
      stage,
      callback
    );
    expect(callback).toHaveBeenCalledTimes(1);
    expect(stage.children[0].name).toBe("root");
    expect(stage.children[0].children[0]).toBeInstanceOf(PIXI.Sprite);
    unmount(stage);
    expect(stage.children).toHaveLength(0);
  });
});
