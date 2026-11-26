import * as PIXI3D from "@pixi/3d";
import * as PIXI from "pixi.js";
import React from "react";
import { describe, expect, it } from "vitest";

import { Container, configure, render, unmount } from "react-pixi-fiber";
import pixi8 from "@react-pixi-fiber/pixi-8";
import react18 from "@react-pixi-fiber/react-18";

import pixi3d0, { Mesh3D, View3D } from "../src/index";

describe("pixi3d0", () => {
  it("renders a mesh in a view in a Container", async () => {
    configure({ react: react18(), pixi: pixi8(), pixi3d: pixi3d0() });
    const root = new PIXI.Container();
    render(
      <Container>
        <View3D>
          <Mesh3D position={[1, 2, 3]} rotation={{ x: 0, y: 1, z: 0 }} />
        </View3D>
      </Container>,
      root
    );
    const container = root.children[0];
    const view = container.children[0] as PIXI3D.View3D;
    expect(view).toBeInstanceOf(PIXI3D.View3D);
    // `@pixi/3d` loads `pixi.js` through Node. The test and the PixiJS 8 adapter must get that copy too.
    expect(view).toBeInstanceOf(PIXI.Container);
    expect(view.parent).toBe(container);
    const mesh = view.root.children[1] as PIXI3D.Mesh3D;
    expect(mesh).toBeInstanceOf(PIXI3D.Mesh3D);
    expect([mesh.position.x, mesh.position.y, mesh.position.z]).toEqual([1, 2, 3]);
    expect(mesh.rotation.y).toBe(1);

    const imported = await import("pixi.js");
    expect(container).toBeInstanceOf(imported.Container);
    expect(imported.VERSION).toBe("8.23.0");

    unmount(root);
    expect(view.destroyed).toBe(true);
    expect(mesh.destroyed).toBe(true);
  });

  it("throws for a 3D node in a Container", () => {
    configure({ react: react18(), pixi: pixi8(), pixi3d: pixi3d0() });
    expect(() =>
      render(
        <Container>
          <Mesh3D />
        </Container>,
        new PIXI.Container()
      )
    ).toThrow(
      "`<Mesh3D />` is a 3D node. It cannot be a child of `<Container />`. Put it in a 3D view or in another 3D node."
    );
  });

  it("throws for a Container in a view", () => {
    configure({ react: react18(), pixi: pixi8(), pixi3d: pixi3d0() });
    expect(() =>
      render(
        <View3D>
          <Container />
        </View3D>,
        new PIXI.Container()
      )
    ).toThrow(
      "`View3D` takes only 3D nodes as children. Put a Display Object next to the view, for example a label after `<View3D>`."
    );
  });
});
