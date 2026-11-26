import * as PIXI3D from "@pixi/3d";
import * as PIXI from "pixi.js";
import React, { createRef, Suspense } from "react";
import { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { configure, PIXIComponent, render, unmount } from "react-pixi-fiber";
import pixi8 from "@react-pixi-fiber/pixi-8";
import react18 from "@react-pixi-fiber/react-18";

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

  it("sets jitter in place and restores it", () => {
    const ref = createRef<PIXI3D.Camera3D>();
    const show = (jitter?: [number, number]) =>
      render(
        <View3D>
          <Camera3D ref={ref} jitter={jitter} />
        </View3D>,
        root
      );
    show([0.25, -0.25]);
    const { jitter } = ref.current!;
    expect(jitter).toBeInstanceOf(PIXI.Point);
    expect([jitter.x, jitter.y]).toEqual([0.25, -0.25]);
    show();
    expect(ref.current!.jitter).toBe(jitter);
    expect([jitter.x, jitter.y]).toEqual([0, 0]);
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

  describe("an active camera", () => {
    const view = createRef<PIXI3D.View3D>();
    const direct = createRef<PIXI3D.Camera3D>();
    const group = createRef<PIXI3D.Container3D>();
    const nested = createRef<PIXI3D.Camera3D>();
    const show = ({ active = true, visible = true, withGroup = true, withNested = true } = {}) =>
      render(
        <View3D ref={view}>
          {withGroup && (
            <Container3D ref={group} visible={visible}>
              <Container3D>{withNested && <Camera3D ref={nested} active={active} />}</Container3D>
            </Container3D>
          )}
          <Camera3D ref={direct} />
        </View3D>,
        root
      );

    it("wins over a direct camera at any depth", () => {
      show();
      expect(view.current!.camera).toBe(nested.current);
      usable(view.current!);
    });

    it("is the last active camera in tree order", () => {
      const refs: Record<string, PIXI3D.Camera3D | null> = {};
      const showTwo = (keys: string[]) =>
        render(
          <View3D ref={view}>
            {keys.map(key => (
              <Container3D key={key}>
                <Camera3D ref={camera => (refs[key] = camera)} active />
              </Container3D>
            ))}
            <Camera3D ref={direct} />
          </View3D>,
          root
        );
      showTwo(["a", "b"]);
      expect(view.current!.camera).toBe(refs.b);
      showTwo(["b", "a"]);
      expect(view.current!.camera).toBe(refs.a);
    });

    describe("warns after the commit", () => {
      const warnings = (error: { mock: { calls: unknown[][] } }) =>
        error.mock.calls.filter(c => /More than one `<Camera3D active \/>`/.test(String(c[0])));
      const showChoice = (choice: string, visible = true) =>
        render(
          <View3D ref={view}>
            <Camera3D active={choice === "a" || choice === "both"} />
            <Container3D visible={visible}>
              <Camera3D active={choice === "b" || choice === "both"} />
            </Container3D>
          </View3D>,
          root
        );

      it("once for a view with two visible active cameras", async () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        showChoice("both");
        await Promise.resolve();
        showChoice("both");
        await Promise.resolve();
        expect(warnings(error)).toHaveLength(__DEV__ ? 1 : 0);
        error.mockRestore();
      });

      it("not for a handover in one commit, or a hidden active camera", async () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        showChoice("b");
        await Promise.resolve();
        // React sets `active` on the first camera before it clears it on the second.
        showChoice("a");
        await Promise.resolve();
        showChoice("both", false);
        await Promise.resolve();
        expect(warnings(error)).toHaveLength(0);
        error.mockRestore();
      });
    });

    it("is the last active camera after a reorder inside a group", () => {
      const refs: Record<string, PIXI3D.Camera3D | null> = {};
      const showTwo = (keys: string[]) =>
        render(
          <View3D ref={view}>
            <Container3D>
              {keys.map(key => (
                <Camera3D key={key} ref={camera => (refs[key] = camera)} active />
              ))}
            </Container3D>
          </View3D>,
          root
        );
      showTwo(["a", "b"]);
      expect(view.current!.camera).toBe(refs.b);
      showTwo(["b", "a"]);
      expect(view.current!.camera).toBe(refs.a);
    });

    it("is the last active camera after a reorder of the groups that hold the cameras", () => {
      const refs: Record<string, PIXI3D.Camera3D | null> = {};
      const showTwo = (keys: string[]) =>
        render(
          <View3D ref={view}>
            <Container3D>
              {keys.map(key => (
                <Container3D key={key}>
                  <Camera3D ref={camera => (refs[key] = camera)} active />
                </Container3D>
              ))}
            </Container3D>
          </View3D>,
          root
        );
      showTwo(["a", "b"]);
      expect(view.current!.camera).toBe(refs.b);
      showTwo(["b", "a"]);
      expect(view.current!.camera).toBe(refs.a);
    });

    it("falls back to the direct rule when `active` turns off", () => {
      show();
      show({ active: false });
      expect(view.current!.camera).toBe(direct.current);
      show();
      expect(view.current!.camera).toBe(nested.current);
    });

    it("falls back while its group is hidden", () => {
      show();
      show({ visible: false });
      expect(view.current!.camera).toBe(direct.current);
      usable(view.current!);
      show();
      expect(view.current!.camera).toBe(nested.current);
    });

    it("falls back when its group leaves", () => {
      show();
      show({ withGroup: false });
      expect(view.current!.camera).toBe(direct.current);
      usable(view.current!);
      show();
      expect(view.current!.camera).toBe(nested.current);
    });

    it("becomes the camera when it is added to a group in the view", () => {
      show({ withNested: false });
      expect(view.current!.camera).toBe(direct.current);
      show();
      expect(view.current!.camera).toBe(nested.current);
      show({ withNested: false });
      expect(view.current!.camera).toBe(direct.current);
    });

    it("is not written to the instance", () => {
      show();
      expect(nested.current).not.toHaveProperty("active");
    });

    it("leaves the other props to the core", () => {
      const reference = new PIXI3D.Camera3D();
      const showProps = (props: object) =>
        render(
          <View3D>
            <Camera3D ref={direct} active {...props} />
          </View3D>,
          root
        );
      showProps({ fov: 40, position: [1, 2, 3] });
      expect(direct.current!.fov).toBe(40);
      expect(direct.current!.position.x).toBe(1);
      showProps({});
      expect(direct.current!.fov).toBe(reference.fov);
      expect(direct.current!.position.x).toBe(reference.position.x);
      reference.destroy();
    });
  });

  describe("a registered camera class", () => {
    const Lens = PIXIComponent("Lens", { create: () => new PIXI3D.Camera3D() });
    const view = createRef<PIXI3D.View3D>();
    const lens = createRef<PIXI3D.Camera3D>();
    const show = ({ visible = true, withLens = true } = {}) =>
      render(<View3D ref={view}>{withLens && <Lens ref={lens} visible={visible} />}</View3D>, root);

    it("is replaced when it is removed from the view", () => {
      show();
      const camera = lens.current;
      expect(view.current!.camera).toBe(camera);
      show({ withLens: false });
      expect(view.current!.camera).not.toBe(camera);
      usable(view.current!);
    });

    it("is replaced when it is hidden", () => {
      show();
      const camera = lens.current;
      show({ visible: false });
      expect(view.current!.camera).not.toBe(camera);
      usable(view.current!);
      show();
      expect(view.current!.camera).toBe(camera);
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
