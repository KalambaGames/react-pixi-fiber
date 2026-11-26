import * as PIXI3D from "@pixi/3d";
import * as PIXI from "pixi.js";
import React, { createRef, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlurFilter, Container, configure, render, Sprite, unmount } from "react-pixi-fiber";
import pixi8 from "@react-pixi-fiber/pixi-8";
import react18 from "@react-pixi-fiber/react-18";

import pixi3d0, { Mesh3D, View3D } from "../src/index";

describe("View3D", () => {
  let root: PIXI.Container;
  beforeEach(() => {
    configure({ react: react18(), pixi: pixi8(), pixi3d: pixi3d0() });
    root = new PIXI.Container();
  });
  afterEach(() => {
    unmount(root);
    vi.restoreAllMocks();
  });

  it("keeps autoResize when width and height become undefined in the same render", () => {
    const ref = createRef<PIXI3D.View3D>();
    const show = (fill: boolean) =>
      render(
        <Container>
          <View3D ref={ref} autoResize={fill} height={fill ? undefined : 240} width={fill ? undefined : 320} />
        </Container>,
        root
      );
    show(false);
    expect(ref.current!.autoResize).toBe(false);
    show(true);
    expect(ref.current!.autoResize).toBe(true);
  });

  it("keeps autoResize when width is removed in a later render", () => {
    const ref = createRef<PIXI3D.View3D>();
    render(<View3D ref={ref} autoResize width={320} />, root);
    render(<View3D ref={ref} autoResize />, root);
    expect(ref.current!.autoResize).toBe(true);
  });

  it("keeps the children in JSX order after the own camera", () => {
    const view = createRef<PIXI3D.View3D>();
    const refs: Record<string, PIXI3D.Mesh3D | null> = {};
    const show = (keys: string[]) =>
      render(
        <View3D ref={view}>
          {keys.map(key => (
            <Mesh3D key={key} ref={mesh => (refs[key] = mesh)} />
          ))}
        </View3D>,
        root
      );
    show(["a", "b", "c"]);
    const own = view.current!.camera;
    expect(own).toBeInstanceOf(PIXI3D.Camera3D);
    const check = (keys: string[]) => {
      expect(view.current!.root.children[0]).toBe(own);
      expect(view.current!.root.children.slice(1)).toEqual(keys.map(key => refs[key]));
    };
    check(["a", "b", "c"]);
    // A swap of the first two moves `a` forward with an insert before `c`.
    show(["b", "a", "c"]);
    check(["b", "a", "c"]);
    show(["c", "b", "a"]);
    check(["c", "b", "a"]);
    show(["d", "c", "b", "a"]);
    check(["d", "c", "b", "a"]);
    show(["d", "b", "a"]);
    check(["d", "b", "a"]);
  });

  it("is a 2D object", () => {
    const before = createRef<PIXI.Sprite>();
    const after = createRef<PIXI.Sprite>();
    const view = createRef<PIXI3D.View3D>();
    const second = createRef<PIXI3D.View3D>();
    const container = createRef<PIXI.Container>();
    render(
      <Container ref={container}>
        <Sprite ref={before} />
        <View3D ref={view} x={10} anchor={[0.5, 0.5]} width={100} />
        <Sprite ref={after} />
        <View3D ref={second} />
      </Container>,
      root
    );
    expect(view.current!.x).toBe(10);
    expect([view.current!.anchor.x, view.current!.anchor.y]).toEqual([0.5, 0.5]);
    expect(view.current!.width).toBe(100);
    expect(container.current!.children).toEqual([before.current, view.current, after.current, second.current]);
    expect(second.current!.root).not.toBe(view.current!.root);
  });

  it("takes a filter child", () => {
    const view = createRef<PIXI3D.View3D>();
    render(
      <View3D ref={view}>
        <BlurFilter />
      </View3D>,
      root
    );
    expect(view.current!.filters).toHaveLength(1);
    expect(view.current!.filters[0]).toBeInstanceOf(PIXI.BlurFilter);
  });

  it("ignores root and camera", async () => {
    vi.resetModules();
    const core = await import("react-pixi-fiber");
    const adapter = await import("../src/index");
    core.configure({ react: react18(), pixi: pixi8(), pixi3d: adapter.default() });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnings = (prop: string) =>
      error.mock.calls.filter(c => String(c[0]).includes(`\`${prop}\` is not a prop of \`<View3D />\`.`));
    const ref = createRef<PIXI3D.View3D>();
    const Scene = adapter.View3D as React.ComponentType<any>;
    const show = (props: object) =>
      core.render(
        <StrictMode>
          <Scene ref={ref} {...props} />
        </StrictMode>,
        root
      );
    show({});
    const { camera, root: scene } = ref.current!;
    show({ camera: new PIXI3D.Camera3D(), root: new PIXI3D.Container3D() });
    show({ camera: new PIXI3D.Camera3D(), root: new PIXI3D.Container3D() });
    show({});
    expect(ref.current!.camera).toBe(camera);
    expect(ref.current!.root).toBe(scene);
    expect(warnings("root")).toHaveLength(__DEV__ ? 1 : 0);
    expect(warnings("camera")).toHaveLength(__DEV__ ? 1 : 0);
    core.unmount(root);
  });

  it("warns when composite changes", async () => {
    vi.resetModules();
    const core = await import("react-pixi-fiber");
    const adapter = await import("../src/index");
    core.configure({ react: react18(), pixi: pixi8(), pixi3d: adapter.default() });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnings = () => error.mock.calls.filter(c => /reads `composite` only in its constructor/.test(String(c[0])));
    const ref = createRef<PIXI3D.View3D>();
    const Scene = adapter.View3D;
    const show = (composite: boolean) =>
      core.render(
        <StrictMode>
          <Scene ref={ref} composite={composite} />
        </StrictMode>,
        root
      );
    show(false);
    expect(warnings()).toHaveLength(0);
    show(true);
    expect(warnings()).toHaveLength(__DEV__ ? 1 : 0);
    core.unmount(root);
  });
});
