import { describe, it, expect } from "vitest";
import React from "react";
import renderer, { act } from "react-test-renderer";
import * as PIXI from "pixi.js";
import react18 from "@react-pixi-fiber/react-18";
import { AlphaFilter, BlurFilter, configure, DisplacementFilter, Sprite, Stage } from "react-pixi-fiber";
import pixi8 from "../src/index";

// Renders `child` as the filter of a Sprite and returns the filter and a function that renders the next child.
async function mount(child: React.ReactElement) {
  configure({ react: react18(), pixi: pixi8() });
  let app: PIXI.Application | null = null;
  const element = (filter: React.ReactElement) => (
    <Stage
      onInit={a => {
        app = a as PIXI.Application;
      }}
      options={{ height: 8, width: 8 }}
    >
      <Sprite>{filter}</Sprite>
    </Stage>
  );
  const tree = renderer.create(element(child), { createNodeMock: () => document.createElement("canvas") });
  await act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });
  const filter = () => (app!.stage.children[0] as PIXI.Sprite).filters[0] as any;
  const update = (next: React.ReactElement) => act(() => tree.update(element(next)));
  return { filter, tree, update };
}

describe("pixi8() filter tags", () => {
  it("writes a { x, y } scale into the DisplacementFilter scale", async () => {
    const sprite = new PIXI.Sprite();
    const { filter, tree } = await mount(<DisplacementFilter scale={{ x: 10, y: 20 }} sprite={sprite} />);
    expect([filter().scale.x, filter().scale.y]).toEqual([10, 20]);
    act(() => tree.unmount());
  });

  it("writes a number scale into both axes of the DisplacementFilter scale", async () => {
    const sprite = new PIXI.Sprite();
    const { filter, tree } = await mount(<DisplacementFilter scale={10} sprite={sprite} />);
    expect([filter().scale.x, filter().scale.y]).toEqual([10, 10]);
    act(() => tree.unmount());
  });

  it("gives a BlurFilter axis override precedence over strength, in either prop order", async () => {
    const first = await mount(<BlurFilter strength={5} strengthX={3} />);
    expect([first.filter().strengthX, first.filter().strengthY]).toEqual([3, 5]);
    act(() => first.tree.unmount());
    const second = await mount(<BlurFilter strengthX={3} strength={5} />);
    expect([second.filter().strengthX, second.filter().strengthY]).toEqual([3, 5]);
    act(() => second.tree.unmount());
  });

  it("moves only the BlurFilter axes without an override when strength changes", async () => {
    const { filter, tree, update } = await mount(<BlurFilter strength={5} strengthX={3} />);
    update(<BlurFilter strength={7} strengthX={3} />);
    expect([filter().strengthX, filter().strengthY]).toEqual([3, 7]);
    update(<BlurFilter strength={7} />);
    expect([filter().strengthX, filter().strengthY]).toEqual([7, 7]);
    act(() => tree.unmount());
  });

  it("keeps resolution inherit on a filter", async () => {
    const { filter, tree, update } = await mount(<AlphaFilter resolution="inherit" />);
    expect(filter().resolution).toBe("inherit");
    update(<AlphaFilter resolution={2} />);
    expect(filter().resolution).toBe(2);
    update(<AlphaFilter resolution="inherit" />);
    expect(filter().resolution).toBe("inherit");
    act(() => tree.unmount());
  });
});
