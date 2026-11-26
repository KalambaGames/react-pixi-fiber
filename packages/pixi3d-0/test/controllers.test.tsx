import * as PIXI3D from "@pixi/3d";
import { FPSCamera as PixiFPSCamera, OrbitCamera as PixiOrbitCamera } from "@pixi/3d/extras";
import * as PIXI from "pixi.js";
import React, { createRef, Suspense, useLayoutEffect } from "react";
import { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Container, configure, render, unmount } from "react-pixi-fiber";
import pixi8 from "@react-pixi-fiber/pixi-8";
import react18 from "@react-pixi-fiber/react-18";

import { controllerBehavior } from "../src/controllers";
import type { ControllerNode } from "../src/index";
import pixi3d0, { Camera3D, Container3D, FPSCamera, OrbitCamera, View3D } from "../src/index";

describe("camera controllers", () => {
  let root: PIXI.Container;
  beforeEach(() => {
    configure({
      react: react18(),
      pixi: pixi8(),
      pixi3d: pixi3d0({ extras: { FPSCamera: PixiFPSCamera, OrbitCamera: PixiOrbitCamera } }),
    });
    root = new PIXI.Container();
  });
  afterEach(() => {
    unmount(root);
    vi.restoreAllMocks();
  });

  it("creates the controller with its view", () => {
    const view = createRef<PIXI3D.View3D>();
    const orbit = createRef<ControllerNode<PixiOrbitCamera>>();
    const fps = createRef<ControllerNode<PixiFPSCamera>>();
    render(
      <View3D ref={view}>
        <OrbitCamera ref={orbit} />
        <FPSCamera ref={fps} />
      </View3D>,
      root
    );
    expect(orbit.current!.controller).toBeInstanceOf(PixiOrbitCamera);
    expect(orbit.current!.controller!.view).toBe(view.current);
    expect(fps.current!.controller).toBeInstanceOf(PixiFPSCamera);
    expect(fps.current!.controller!.view).toBe(view.current);
  });

  it("writes props at mount and on update", () => {
    const orbit = createRef<ControllerNode<PixiOrbitCamera>>();
    render(
      <View3D>
        <OrbitCamera ref={orbit} target={[0, 1, 0]} enableDamping maxDistance={20} />
      </View3D>,
      root
    );
    const controller = orbit.current!.controller!;
    const target = controller.target;
    expect([target.x, target.y, target.z]).toEqual([0, 1, 0]);
    expect(controller.enableDamping).toBe(true);
    expect(controller.maxDistance).toBe(20);

    render(
      <View3D>
        <OrbitCamera ref={orbit} target={{ x: 1, y: 1, z: 1 }} enableDamping />
      </View3D>,
      root
    );
    const reference = new PixiOrbitCamera({ view: new PIXI3D.View3D() });
    expect(controller.maxDistance).toBe(reference.maxDistance);
    reference.destroy();
    expect(controller.target).toBe(target);
    expect([target.x, target.y, target.z]).toEqual([1, 1, 1]);
  });

  it("returns a removed vector to its value before the first write", () => {
    const orbit = createRef<ControllerNode<PixiOrbitCamera>>();
    const show = (withTarget: boolean) =>
      render(
        <View3D>
          <OrbitCamera ref={orbit} target={withTarget ? [1, 2, 3] : undefined} />
        </View3D>,
        root
      );
    show(true);
    const target = orbit.current!.controller!.target;
    show(false);
    expect(orbit.current!.controller!.target).toBe(target);
    expect([target.x, target.y, target.z]).toEqual([0, 0, 0]);
  });

  it("writes a part of an object prop", () => {
    const orbit = createRef<ControllerNode<PixiOrbitCamera>>();
    const show = (withButtons: boolean) =>
      render(
        <View3D>
          <OrbitCamera ref={orbit} mouseButtons={withButtons ? { left: "pan" } : undefined} />
        </View3D>,
        root
      );
    show(true);
    const controller = orbit.current!.controller!;
    const defaults = PixiOrbitCamera.defaultOptions.mouseButtons;
    expect(controller.mouseButtons).toEqual({ ...defaults, left: "pan" });
    show(false);
    expect(controller.mouseButtons).toEqual(defaults);
  });

  it("writes `up` through its setter", () => {
    const orbit = createRef<ControllerNode<PixiOrbitCamera>>();
    render(
      <View3D>
        <OrbitCamera ref={orbit} up={[0, 0, 2]} />
      </View3D>,
      root
    );
    // The setter normalizes the vector.
    const up = orbit.current!.controller!.up;
    expect([up.x, up.y, up.z]).toEqual([0, 0, 1]);
  });

  it("starts from the camera of the view, and walks from where a change of its `position` moved it", () => {
    const view = createRef<PIXI3D.View3D>();
    const camera = createRef<PIXI3D.Camera3D>();
    const fps = createRef<ControllerNode<PixiFPSCamera>>();
    const show = (position: [number, number, number]) =>
      render(
        <View3D ref={view}>
          <Camera3D ref={camera} position={position} />
          <FPSCamera ref={fps} />
        </View3D>,
        root
      );
    const coordinates = () => {
      const { x, y, z } = view.current!.camera.position;
      return [x, y, z];
    };
    const first: [number, number, number] = [1, 2, 3];
    const second: [number, number, number] = [4, 5, 6];
    show(first);
    expect(view.current!.camera).toBe(camera.current);
    expect(coordinates()).toEqual(first);
    show(second);
    expect(coordinates()).toEqual(second);
    // The controller walks from the moved camera.
    fps.current!.controller!.update();
    expect(coordinates()).toEqual(second);
    expect(fps.current!.controller).not.toHaveProperty("position");
  });

  it("builds the controller one time, at commit", () => {
    let built = 0;
    class Counted extends PixiOrbitCamera {
      constructor(options: ConstructorParameters<typeof PixiOrbitCamera>[0]) {
        super(options);
        built += 1;
      }
    }
    configure({ react: react18(), pixi: pixi8(), pixi3d: pixi3d0({ extras: { OrbitCamera: Counted } }) });
    const seen: number[] = [];
    // React renders this sibling after it added the controller element to the view, and before the commit.
    const Probe = () => {
      seen.push(built);
      useLayoutEffect(() => {
        seen.push(built);
      });
      return null;
    };
    const show = (keys: string[]) =>
      render(
        <Container>
          <View3D>{keys.map(key => (key === "orbit" ? <OrbitCamera key={key} /> : <Container3D key={key} />))}</View3D>
          <Probe />
        </Container>,
        root
      );
    show(["orbit", "group"]);
    expect(seen).toEqual([0, 1]);
    show(["group", "orbit"]);
    show(["group", "orbit"]);
    expect(built).toBe(1);
  });

  it("builds no controller in a render that React discards", () => {
    let built = 0;
    class Counted extends PixiOrbitCamera {
      constructor(options: ConstructorParameters<typeof PixiOrbitCamera>[0]) {
        super(options);
        built += 1;
      }
    }
    configure({ react: react18(), pixi: pixi8(), pixi3d: pixi3d0({ extras: { OrbitCamera: Counted } }) });
    vi.spyOn(console, "error").mockImplementation(() => {});
    // React renders this sibling after it added the controller element to the view.
    const Throwing = () => {
      throw new Error("discarded");
    };
    expect(() =>
      render(
        <Container>
          <View3D>
            <OrbitCamera />
          </View3D>
          <Throwing />
        </Container>,
        root
      )
    ).toThrow("discarded");
    expect(built).toBe(0);
  });

  // React 18 commits no instance hidden, so this test cannot reach a hidden `<Activity>` that removes a node before it
  // shows. The test calls the behavior directly.
  it("destroys a node that was never mounted", () => {
    const behavior = controllerBehavior("OrbitCamera", PixiOrbitCamera);
    const node = behavior.create({}) as ControllerNode<PixiOrbitCamera>;
    behavior.applyProps!.call({} as never, node, undefined, { enabled: false });
    node.visible = false;
    expect(() => node.destroy()).not.toThrow();
    expect(node.controller).toBe(null);
  });

  it("follows the camera of the view", () => {
    const view = createRef<PIXI3D.View3D>();
    const orbit = createRef<ControllerNode<PixiOrbitCamera>>();
    const show = (withCamera: boolean) =>
      render(
        <View3D ref={view}>
          <OrbitCamera ref={orbit} />
          {withCamera && <Camera3D />}
        </View3D>,
        root
      );
    show(false);
    show(true);
    expect(orbit.current!.controller!.camera).toBe(view.current!.camera);
    expect(view.current!.camera).toBeInstanceOf(PIXI3D.Camera3D);
  });

  describe("destroys the controller", () => {
    // React clears the ref on unmount, so `check` keeps the node before the unmount.
    const check = (show: (on: boolean, ref: React.RefObject<ControllerNode<PixiOrbitCamera>>) => void) => {
      const orbit = createRef<ControllerNode<PixiOrbitCamera>>();
      show(true, orbit);
      const node = orbit.current!;
      const destroy = vi.spyOn(node.controller!, "destroy");
      show(false, orbit);
      expect(destroy).toHaveBeenCalledTimes(1);
      expect(node.controller).toBe(null);
    };

    it("with its element", () => {
      check((on, ref) => render(<View3D>{on && <OrbitCamera ref={ref} />}</View3D>, root));
    });

    it("with its view", () => {
      check((on, ref) =>
        render(
          <Container>
            {on && (
              <View3D>
                <OrbitCamera ref={ref} />
              </View3D>
            )}
          </Container>,
          root
        )
      );
    });

    it("with an ancestor of its view", () => {
      check((on, ref) =>
        render(
          <Container>
            {on && (
              <Container key="ancestor">
                <View3D>
                  <OrbitCamera ref={ref} />
                </View3D>
              </Container>
            )}
          </Container>,
          root
        )
      );
    });
  });

  describe("disables a hidden controller", () => {
    let resolve: () => void;
    let suspended: boolean;
    let pending: Promise<void>;
    const Suspending = () => {
      if (suspended) throw pending;
      return null;
    };
    const orbit = createRef<ControllerNode<PixiOrbitCamera>>();
    const show = (enabled?: boolean) =>
      render(
        <View3D>
          <Suspense fallback={null}>
            <OrbitCamera ref={orbit} enabled={enabled} />
            <Suspending />
          </Suspense>
        </View3D>,
        root
      );

    beforeEach(() => {
      suspended = false;
      pending = new Promise<void>(r => {
        resolve = () => {
          suspended = false;
          r();
        };
      });
    });

    const hideAndReveal = async (enabled?: boolean) => {
      act(() => show(enabled));
      const controller = orbit.current!.controller!;
      expect(controller.enabled).toBe(enabled ?? true);
      suspended = true;
      act(() => show(enabled));
      expect(controller.enabled).toBe(false);
      await act(async () => {
        resolve();
        await pending;
      });
      return controller;
    };

    it("and enables it on reveal", async () => {
      const controller = await hideAndReveal();
      expect(controller.enabled).toBe(true);
    });

    it("and keeps `enabled={false}` on reveal", async () => {
      const controller = await hideAndReveal(false);
      expect(controller.enabled).toBe(false);
    });
  });

  it("throws outside a view", () => {
    expect(() =>
      render(
        <Container>
          <OrbitCamera />
        </Container>,
        new PIXI.Container()
      )
    ).toThrow(
      "`<OrbitCamera />` is a 3D node. It cannot be a child of `<Container />`. Put it in a 3D view or in another 3D node."
    );
    expect(() =>
      render(
        <View3D>
          <Container3D>
            <OrbitCamera />
          </Container3D>
        </View3D>,
        new PIXI.Container()
      )
    ).toThrow("`<OrbitCamera />` must be a direct child of `<View3D />`.");
  });

  it("throws for a class that is not in extras", () => {
    configure({ react: react18(), pixi: pixi8(), pixi3d: pixi3d0() });
    expect(() =>
      render(
        <View3D>
          <OrbitCamera />
        </View3D>,
        new PIXI.Container()
      )
    ).toThrow("`OrbitCamera` is not in `pixi3d0({ extras })`. Add `OrbitCamera` from `@pixi/3d/extras` to it.");
  });
});
