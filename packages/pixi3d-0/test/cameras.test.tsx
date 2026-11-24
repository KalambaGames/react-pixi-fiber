import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { createRef, Suspense } from "react";
import { act } from "react-test-renderer";
import * as PIXI from "pixi.js";
import * as PIXI3D from "@pixi/3d";
import pixi8 from "@react-pixi-fiber/pixi-8";
import react18 from "@react-pixi-fiber/react-18";
import { configure, render, unmount } from "react-pixi-fiber";
import pixi3d0, { Camera3D, Container3D, Mesh3D, View3D } from "../src/index";
import { viewOf } from "../src/view";

describe("cameras", () => {
  let root: PIXI.Container;
  beforeEach(() => {
    configure({ react: react18(), pixi: pixi8(), pixi3d: pixi3d0() });
    root = new PIXI.Container();
  });
  afterEach(() => {
    unmount(root);
  });

  // In the view, and the camera and each of its ancestors visible: what `@pixi/3d` checks on each frame.
  const usable = (view: PIXI3D.View3D) => {
    expect(viewOf(view.camera)).toBe(view);
    for (let node: PIXI3D.Container3D | null = view.camera; node !== null; node = node.parent) {
      expect(node.visible).toBe(true);
    }
  };

  it("takes a direct camera", () => {
    const view = createRef<PIXI3D.View3D>();
    const camera = createRef<PIXI3D.Camera3D>();
    render(
      <View3D ref={view}>
        <Camera3D ref={camera} fov={40} />
      </View3D>,
      root
    );
    expect(view.current!.camera).toBe(camera.current);
    expect(view.current!.camera.fov).toBe(40);
  });

  it("takes the last of two direct cameras", () => {
    const view = createRef<PIXI3D.View3D>();
    const refs: Record<string, PIXI3D.Camera3D | null> = {};
    const show = (keys: string[]) =>
      render(
        <View3D ref={view}>
          {keys.map(key => (
            <Camera3D key={key} ref={camera => (refs[key] = camera)} />
          ))}
        </View3D>,
        root
      );
    show(["a", "b"]);
    expect(view.current!.camera).toBe(refs.b);
    show(["b", "a"]);
    expect(view.current!.camera).toBe(refs.a);
  });

  it("skips a hidden camera", () => {
    const view = createRef<PIXI3D.View3D>();
    const first = createRef<PIXI3D.Camera3D>();
    const last = createRef<PIXI3D.Camera3D>();
    const show = (visible: boolean) =>
      render(
        <View3D ref={view}>
          <Camera3D ref={first} />
          <Camera3D ref={last} visible={visible} />
        </View3D>,
        root
      );
    show(true);
    expect(view.current!.camera).toBe(last.current);
    show(false);
    expect(view.current!.camera).toBe(first.current);
    show(true);
    expect(view.current!.camera).toBe(last.current);
  });

  it("falls back when the current camera leaves", () => {
    const view = createRef<PIXI3D.View3D>();
    const refs: Record<string, PIXI3D.Camera3D | null> = {};
    const show = (keys: string[]) =>
      render(
        <View3D ref={view}>
          {keys.map(key => (
            <Camera3D key={key} ref={camera => (refs[key] = camera)} />
          ))}
        </View3D>,
        root
      );
    show([]);
    const own = view.current!.camera;
    show(["a", "b"]);
    const a = refs.a;
    show(["a"]);
    expect(view.current!.camera).toBe(a);
    show([]);
    expect(view.current!.camera).toBe(own);
    usable(view.current!);
  });

  describe("an assigned camera in a rig", () => {
    let resolve: () => void;
    let suspended: boolean;
    const promise = () =>
      new Promise<void>(r => {
        resolve = () => {
          suspended = false;
          r();
        };
      });
    let pending: Promise<void>;
    const Suspending = () => {
      if (suspended) throw pending;
      return null;
    };
    const view = createRef<PIXI3D.View3D>();
    const rig = createRef<PIXI3D.Container3D>();
    const nested = createRef<PIXI3D.Camera3D>();
    const show = (withRig: boolean, x = 0) =>
      render(
        <View3D ref={view}>
          <Mesh3D />
          <Suspense fallback={null}>
            {withRig && (
              <Container3D ref={rig} x={x}>
                <Camera3D ref={nested} />
              </Container3D>
            )}
            <Suspending />
          </Suspense>
        </View3D>,
        root
      );

    beforeEach(() => {
      suspended = false;
      pending = promise();
      act(() => show(true));
      view.current!.camera = nested.current!;
    });

    it("stays the camera across a rerender", () => {
      act(() => show(true, 5));
      expect(rig.current!.x).toBe(5);
      expect(view.current!.camera).toBe(nested.current);
    });

    it("is replaced when the rig leaves", () => {
      expect(view.current!.camera).toBe(nested.current);
      act(() => show(false));
      usable(view.current!);
    });

    it("is replaced when the rig is hidden", async () => {
      expect(view.current!.camera).toBe(nested.current);
      suspended = true;
      act(() => show(true));
      expect(rig.current!.visible).toBe(false);
      expect(view.current!.camera).not.toBe(nested.current);
      usable(view.current!);
      await act(async () => {
        resolve();
        await pending;
      });
      expect(rig.current!.visible).toBe(true);
      // The switch does not come back by itself to a camera the app assigned.
      expect(view.current!.camera).not.toBe(nested.current);
    });
  });

  it("makes a new own camera when the app destroyed it", () => {
    const view = createRef<PIXI3D.View3D>();
    const show = (withCamera: boolean) => render(<View3D ref={view}>{withCamera && <Camera3D />}</View3D>, root);
    show(false);
    const own = view.current!.camera;
    show(true);
    own.destroy();
    show(false);
    expect(view.current!.camera).not.toBe(own);
    expect(view.current!.root.children[0]).toBe(view.current!.camera);
    usable(view.current!);
  });
});
