import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { createRef } from "react";
import * as PIXI from "pixi.js";
import type * as PIXI3D from "@pixi/3d";
import { OrbitCamera as PixiOrbitCamera } from "@pixi/3d/extras";
import pixi8 from "@react-pixi-fiber/pixi-8";
import pixi3d0, { Camera3D, Container3D, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";
import type { ControllerNode } from "@react-pixi-fiber/pixi3d-0";
import { configure, Container, render, unmount } from "react-pixi-fiber";
import type { ReactAdapter } from "react-pixi-fiber";

// The PixiJS 3D adapter with one React adapter. The tree renders into a `PIXI.Container`, not a `<Stage>`: with
// `@pixi/3d` imported, `Application.init` with the WebGL renderer throws under the WebGL mock.
export function smoke3dSuite(name: string, react: () => ReactAdapter) {
  describe(`smoke 3D: ${name}`, () => {
    let root: PIXI.Container;
    beforeEach(() => {
      configure({
        react: react(),
        pixi: pixi8(),
        pixi3d: pixi3d0({ extras: { OrbitCamera: PixiOrbitCamera } }),
      });
      root = new PIXI.Container();
    });
    afterEach(() => {
      unmount(root);
    });

    it("renders meshes in a view, changes a vector prop, reorders them and unmounts", () => {
      const view = createRef<PIXI3D.View3D>();
      const meshes: Record<string, PIXI3D.Mesh3D | null> = {};
      const show = (order: string[], x: number) =>
        render(
          <Container>
            <View3D ref={view}>
              {order.map(key => (
                <Mesh3D key={key} ref={mesh => (meshes[key] = mesh)} position={key === "a" ? [x, 2, 3] : 0} />
              ))}
            </View3D>
          </Container>,
          root
        );
      show(["a", "b"], 1);
      const scene = view.current!.root;
      const a = meshes.a!;
      expect(scene.children).toContain(a);
      expect([a.position.x, a.position.y, a.position.z]).toEqual([1, 2, 3]);

      show(["a", "b"], 5);
      expect(a.position.x).toBe(5);

      show(["b", "a"], 5);
      expect(scene.children.indexOf(meshes.b!)).toBeLessThan(scene.children.indexOf(a));

      unmount(root);
      expect(root.children).toHaveLength(0);
      expect(a.destroyed).toBe(true);
    });

    it("switches the active camera in one commit", () => {
      const view = createRef<PIXI3D.View3D>();
      const front = createRef<PIXI3D.Camera3D>();
      const side = createRef<PIXI3D.Camera3D>();
      const show = (choice: string) =>
        render(
          <View3D ref={view}>
            <Camera3D ref={front} active={choice === "front"} />
            <Container3D>
              <Camera3D ref={side} active={choice === "side"} />
            </Container3D>
          </View3D>,
          root
        );
      show("front");
      expect(view.current!.camera).toBe(front.current);
      show("side");
      expect(view.current!.camera).toBe(side.current);
      show("front");
      expect(view.current!.camera).toBe(front.current);
    });

    it("builds a controller at commit and destroys it with its view", () => {
      const orbit = createRef<ControllerNode<PixiOrbitCamera>>();
      render(
        <View3D>
          <Camera3D position={[0, 5, 10]} />
          <OrbitCamera ref={orbit} enableDamping />
        </View3D>,
        root
      );
      const node = orbit.current!;
      expect(node.controller).toBeInstanceOf(PixiOrbitCamera);
      expect(node.controller!.enableDamping).toBe(true);

      unmount(root);
      expect(node.controller).toBeNull();
    });
  });
}
