import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import react18 from "@react-pixi-fiber/react-18";

import { createFakeNode3d, fakePixi3dAdapter } from "./utils/fakePixi3dAdapter";
import { createFakeNode, fakePixiAdapter, point } from "./utils/fakePixiAdapter";

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
    stage = createFakeNode3d("Stage");
    render(<Node3D />, stage);
    expect(stage.children[0].x).toBe(5);
    render(<Node3D x={1} />, stage);
    expect(stage.children[0].x).toBe(1);
    render(<Node3D />, stage);
    expect(stage.children[0].x).toBe(5);
  });
});

describe("props of a 3D node", () => {
  let configure, render, PIXIComponent, Container, Node3D, View, pixi, pixi3d, stage, error;
  const xyz = vector => [vector.x, vector.y, vector.z];
  const strict = element => <React.StrictMode>{element}</React.StrictMode>;
  const node = () => stage.children[0];
  beforeEach(async () => {
    vi.resetModules();
    const core = await import("../src/index");
    ({ configure, render, PIXIComponent } = core);
    Container = "Container";
    Node3D = "Node3D";
    View = "View";
    pixi = fakePixiAdapter();
    pixi3d = fakePixi3dAdapter();
    stage = createFakeNode3d("Stage");
    error = vi.spyOn(console, "error").mockImplementation(() => {});
    configure({ react: react18(), pixi, pixi3d });
  });
  afterEach(() => error.mockRestore());

  it("writes a vector to a prop that the PixiJS table types as a number", () => {
    pixi.properties.numeric.push("rotation");
    render(strict(<Node3D rotation={{ x: 0, y: 1, z: 0 }} />), stage);
    expect(node().rotation.y).toBe(1);
    render(strict(<Node3D rotation={{ x: 0, y: 2, z: 0 }} />), stage);
    expect(node().rotation.y).toBe(2);
    expect(error).not.toHaveBeenCalled();
  });

  it("writes an array to a vector", () => {
    render(strict(<Node3D position={[1, 2, 3]} />), stage);
    expect(xyz(node().position)).toEqual([1, 2, 3]);
  });

  it("restores a copy of the default when a vector prop is removed", () => {
    render(strict(<Node3D position={[1, 2, 3]} />), stage);
    const position = node().position;
    render(strict(<Node3D />), stage);
    expect(xyz(node().position)).toEqual([0, 0, 0]);
    expect(node().position).toBe(position);
  });

  it("restores the class default of a prop that was set at mount", () => {
    render(strict(<Node3D x={4} />), stage);
    expect(node().x).toBe(4);
    render(strict(<Node3D />), stage);
    expect(node().x).toBe(0);
  });

  it.each([null, {}, [1, 2], "a"])("warns and resets a value that no point takes: %j", value => {
    render(strict(<Node3D position={[1, 2, 3]} />), stage);
    render(strict(<Node3D position={value} />), stage);
    expect(xyz(node().position)).toEqual([0, 0, 0]);
    expect(error).toHaveBeenCalledTimes(__DEV__ ? 1 : 0);
    if (__DEV__) {
      expect(error.mock.calls[0].join(" ")).toContain(
        "for prop `position` on `<Node3D />`. Resetting it to its default"
      );
    }
  });

  it("sets a 2D point of a 3D node with the 3D adapter", () => {
    const isPoint = vi.spyOn(pixi, "isPoint");
    const copyPoint = vi.spyOn(pixi, "copyPoint");
    render(strict(<Node3D anchor={[0.5, 1]} position={[1, 2, 3]} />), stage);
    expect(node().anchor).toMatchObject({ x: 0.5, y: 1 });
    expect(xyz(node().position)).toEqual([1, 2, 3]);
    const seen = [...isPoint.mock.calls, ...copyPoint.mock.calls].flat();
    expect(seen).not.toContain(node().anchor);
    expect(seen).not.toContain(node().position);
    expect(seen).not.toContainEqual([0.5, 1]);
    expect(seen).not.toContainEqual([1, 2, 3]);
  });

  it("keeps the PixiJS tables for an instance that is not a 3D node", () => {
    pixi.properties.numeric.push("rotation");
    stage = createFakeNode("Stage");
    render(strict(<View rotation={0.5} />), stage);
    render(strict(<View rotation={{ x: 0, y: 1, z: 0 }} />), stage);
    expect(stage.children[0].rotation).toBe(0);
    expect(error).toHaveBeenCalledTimes(__DEV__ ? 1 : 0);
    const other = createFakeNode("Stage2");
    render(strict(<Container position={[1, 2]} />), other);
    expect(other.children[0].position).toMatchObject({ x: 1, y: 2 });
  });

  it("gives a 3D class registered with PIXIComponent the 3D tables", () => {
    const Custom3D = "Custom3D";
    stage = createFakeNode("Stage");
    PIXIComponent("Custom3D", { create: () => createFakeNode3d("Custom3D") });
    render(
      strict(
        <View>
          <Custom3D position={[1, 2, 3]} />
        </View>
      ),
      stage
    );
    expect(xyz(stage.children[0].root.children[0].position)).toEqual([1, 2, 3]);
  });

  it("writes a plain prop of a 3D node as-is", () => {
    const material = {};
    render(strict(<Node3D material={material} />), stage);
    expect(node().material).toBe(material);
  });
});

describe("tree rules", () => {
  let configure, render, Container, Node3D, View, BlurFilter, stage, error;
  const strict = element => <React.StrictMode>{element}</React.StrictMode>;
  const as3dChild = "`<Node3D />` is a 3D node. It cannot be a child of ";
  beforeEach(async () => {
    vi.resetModules();
    const core = await import("../src/index");
    ({ configure, render } = core);
    Container = "Container";
    Node3D = "Node3D";
    View = "View";
    BlurFilter = "BlurFilter";
    stage = createFakeNode("Stage");
    error = vi.spyOn(console, "error").mockImplementation(() => {});
    configure({ react: react18(), pixi: fakePixiAdapter(), pixi3d: fakePixi3dAdapter() });
  });
  afterEach(() => error.mockRestore());

  it("throws for a 3D node in a 2D parent", () => {
    render(<Container />, stage);
    const parent = stage.children[0];
    expect(() =>
      render(
        <Container>
          <Node3D />
        </Container>,
        stage
      )
    ).toThrow(as3dChild + "`<Container />`. Put it in a 3D view or in another 3D node.");
    expect(parent.children).toEqual([]);
  });

  it("throws at mount for a 3D node in a 2D parent", () => {
    expect(() =>
      render(
        <Container>
          <Node3D />
        </Container>,
        stage
      )
    ).toThrow(as3dChild + "`<Container />`. Put it in a 3D view or in another 3D node.");
    expect(stage.children).toEqual([]);
  });

  it("throws at mount for a 2D object in a 3D node", () => {
    expect(() =>
      render(
        <View>
          <Node3D>
            <Container />
          </Node3D>
        </View>,
        stage
      )
    ).toThrow("`<Container />` is not a 3D node. It cannot be a child of the 3D node `<Node3D />`.");
    expect(stage.children).toEqual([]);
  });

  it("throws for a 3D node in the root container", () => {
    expect(() => render(<Node3D />, stage)).toThrow(
      as3dChild + "the root container. Put it in a 3D view or in another 3D node."
    );
    expect(stage.children).toEqual([]);
  });

  it("throws for a 2D object in a 3D node", () => {
    render(
      <View>
        <Node3D />
      </View>,
      stage
    );
    const parent = stage.children[0].root.children[0];
    expect(() =>
      render(
        <View>
          <Node3D>
            <Container />
          </Node3D>
        </View>,
        stage
      )
    ).toThrow("`<Container />` is not a 3D node. It cannot be a child of the 3D node `<Node3D />`.");
    expect(parent.children).toEqual([]);
  });

  it("throws for a filter in a 3D node", () => {
    render(
      <View>
        <Node3D />
      </View>,
      stage
    );
    const parent = stage.children[0].root.children[0];
    expect(() =>
      render(
        <View>
          <Node3D>
            <BlurFilter />
          </Node3D>
        </View>,
        stage
      )
    ).toThrow(
      "`<BlurFilter />` is a filter. It cannot be a child of the 3D node `<Node3D />`. Put it in the element of the 3D view."
    );
    expect(parent.children).toEqual([]);
    expect(parent.filters).toBeUndefined();
  });

  it("throws before an insertion", () => {
    render(
      <Container>
        <Container key="a" />
      </Container>,
      stage
    );
    const parent = stage.children[0];
    expect(() =>
      render(
        <Container>
          <Node3D key="b" />
          <Container key="a" />
        </Container>,
        stage
      )
    ).toThrow(as3dChild + "`<Container />`. Put it in a 3D view or in another 3D node.");
    expect(parent.children).toHaveLength(1);
  });

  it("accepts a 3D node in a 3D node, a filter in a view and a tree with no 3D adapter", () => {
    render(
      <View>
        <Node3D>
          <Node3D />
        </Node3D>
        <BlurFilter />
      </View>,
      stage
    );
    expect(stage.children[0].root.children[0].children).toHaveLength(1);
    expect(stage.children[0].filters).toHaveLength(1);
    configure({ react: react18(), pixi: fakePixiAdapter() });
    const other = createFakeNode("Stage2");
    render(
      <Container>
        <Container />
      </Container>,
      other
    );
    expect(other.children[0].children).toHaveLength(1);
  });
});

// ADR 0022: the 3D adapter holds every PixiJS 3D class name and every rule for a third coordinate, not the core.
describe("the core source", () => {
  it("names no PixiJS 3D class and no third coordinate", () => {
    const src = join(import.meta.dirname, "../src");
    const hits = [];
    for (const file of readdirSync(src, { recursive: true })) {
      if (!/\.tsx?$/.test(file)) continue;
      readFileSync(join(src, file), "utf8")
        .split("\n")
        .forEach((line, index) => {
          if (/Container3D|View3D|Mesh3D|\bz\b/.test(line)) hits.push(`${file}:${index + 1}`);
        });
    }
    expect(hits).toEqual([]);
  });
});
