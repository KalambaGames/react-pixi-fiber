import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import react18 from "@react-pixi-fiber/react-18";
import { createFakeNode, fakePixiAdapter } from "./utils/fakePixiAdapter";
import { fakePixi3dAdapter } from "./utils/fakePixi3dAdapter";

describe("configure with a PixiJS 3D adapter", () => {
  let configure, render, Container, Node3D, View, pixi, pixi3d, stage;
  beforeEach(async () => {
    vi.resetModules();
    const core = await import("../src/index");
    ({ configure, render } = core);
    Container = "Container";
    Node3D = "Node3D";
    View = "View";
    pixi = fakePixiAdapter();
    pixi3d = fakePixi3dAdapter();
    stage = createFakeNode("Stage");
  });

  it("creates a tag of the 3D adapter", () => {
    configure({ react: react18(), pixi, pixi3d });
    render(
      <View>
        <Node3D />
      </View>,
      stage
    );
    expect(stage.children[0].root.children[0].is3d).toBe(true);
  });

  it("throws for a tag in both adapters and keeps the previous configuration", () => {
    configure({ react: react18(), pixi });
    const clash = fakePixi3dAdapter();
    clash.behaviors.Container = { create: () => ({}) };
    expect(() => configure({ react: react18(), pixi, pixi3d: clash })).toThrow(
      "`configure` got the tag `Container` from the PixiJS adapter and from the PixiJS 3D adapter. A tag belongs to one adapter."
    );
    render(<Container />, stage);
    expect(stage.children.length).toBe(1);
    expect(() => render(<Node3D />, createFakeNode("Stage"))).toThrow("does not know the tag `Node3D`");
  });

  it("throws for a pixi3d that is not an adapter", () => {
    expect(() => configure({ react: react18(), pixi, pixi3d: {} })).toThrow(
      "`configure` expects `pixi3d` to be the object a PixiJS 3D adapter factory returns. Call the factory: `configure({ react: react19(), pixi: pixi8(), pixi3d: pixi3d0() })`."
    );
  });

  it("removes the 3D tags when configured again without pixi3d", () => {
    configure({ react: react18(), pixi, pixi3d });
    configure({ react: react18(), pixi });
    expect(() => render(<Node3D />, stage)).toThrow("does not know the tag `Node3D`");
  });

  it("fills the defaults of a 3D tag", () => {
    configure({ react: react18(), pixi, pixi3d: fakePixi3dAdapter({ defaults: { Node3D: { x: 5 } } }) });
    render(<Node3D />, stage);
    expect(stage.children[0].x).toBe(5);
    render(<Node3D x={1} />, stage);
    expect(stage.children[0].x).toBe(1);
    render(<Node3D />, stage);
    expect(stage.children[0].x).toBe(5);
  });
});
