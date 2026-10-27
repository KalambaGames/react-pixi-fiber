import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { act } from "react-test-renderer";
import * as PIXI from "pixi.js";
import { Application } from "pixi.js";
import react18 from "@react-pixi-fiber/react-18";
import { configure, Sprite, Stage } from "react-pixi-fiber";
import pixi8, { pixi8WithClasses } from "../src/index";

it("PixiJS 8 Application.init resolves under jsdom with the WebGL mock", async () => {
  const app = new Application();
  await app.init({ width: 4, height: 4, preference: "webgl" });
  expect(app.stage).toBeDefined();
  app.destroy();
});

describe("Stage with the pixi-8 adapter", () => {
  const pixi = pixi8();
  const { createApplication, destroyApplication } = pixi;
  const created: Promise<unknown>[] = [];
  // Whether each destroyed application's canvas was still in the document.
  const destroyedConnected: boolean[] = [];
  pixi.createApplication = options => {
    const app = createApplication(options);
    created.push(Promise.resolve(app));
    return app;
  };
  pixi.destroyApplication = (app: Application, removeView, stageOptions) => {
    destroyedConnected.push(app.canvas.isConnected);
    destroyApplication(app, removeView, stageOptions);
  };
  const settle = (index: number) =>
    act(async () => {
      await created[index];
      await new Promise(r => setTimeout(r, 0));
    });
  let container: HTMLDivElement;
  let previousActEnvironment: unknown;
  let root: Root;

  beforeEach(() => {
    configure({ react: react18(), pixi });
    created.length = 0;
    destroyedConnected.length = 0;
    previousActEnvironment = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.body.appendChild(document.createElement("div"));
    root = createRoot(container);
  });
  afterEach(async () => {
    act(() => root.unmount());
    // Let the deferred destroy of an unmounted Stage run before the next test.
    await act(() => new Promise(r => setTimeout(r, 0)));
    container.remove();
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  it("draws on options.canvas and renders no canvas of its own", async () => {
    const canvas = document.createElement("canvas");
    const onInit = vi.fn();
    act(() => root.render(createElement(Stage, { onInit, options: { canvas, height: 4, width: 4 } })));
    await settle(0);
    expect(onInit).toHaveBeenCalledTimes(1);
    expect(onInit.mock.calls[0][0].canvas).toBe(canvas);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("draws on options.view when options.canvas is given too, as PixiJS 8 does", async () => {
    const view = document.createElement("canvas");
    const onInit = vi.fn();
    const options = { canvas: document.createElement("canvas"), height: 4, view, width: 4 };
    act(() => root.render(createElement(Stage, { onInit, options })));
    await settle(0);
    expect(onInit.mock.calls[0][0].canvas).toBe(view);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("destroys an application created with outdated options only once its canvas is out of the document", async () => {
    const onInit = vi.fn();
    act(() => root.render(createElement(Stage, { onInit, options: { antialias: false, height: 4, width: 4 } })));
    act(() => root.render(createElement(Stage, { onInit, options: { antialias: true, height: 4, width: 4 } })));
    await settle(0);
    expect(destroyedConnected).toEqual([false]);
    expect(created).toHaveLength(2);
    await settle(1);
    expect(onInit).toHaveBeenCalledTimes(1);
    expect(onInit.mock.calls[0][0]).toBe(await created[1]);
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
    expect(destroyedConnected).toEqual([false]);
    act(() => root.unmount());
    await act(() => new Promise(r => setTimeout(r, 0)));
    expect(destroyedConnected).toEqual([false, false]);
  });

  it("mounts on a provided app that has only stage and ticker, renders no canvas and never creates an application", async () => {
    const trimmed = pixi8WithClasses({ classes: { Container: PIXI.Container, Sprite: PIXI.Sprite } });
    const createApplication = vi.spyOn(trimmed, "createApplication");
    configure({ react: react18(), pixi: trimmed });
    const stage = new PIXI.Container();
    const app = { stage, ticker: PIXI.Ticker.shared } as unknown as Application;
    await act(async () =>
      root.render(createElement(Stage, { app }, createElement(Sprite, { texture: PIXI.Texture.WHITE })))
    );
    expect(container.querySelector("canvas")).toBeNull();
    expect(stage.children).toHaveLength(1);
    expect(stage.children[0]).toBeInstanceOf(PIXI.Sprite);
    expect(createApplication).not.toHaveBeenCalled();
  });
});
