import * as PIXI from "pixi.js";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { Container, configure, PIXIComponent, render, unmount } from "react-pixi-fiber";
import react18 from "@react-pixi-fiber/react-18";

import pixi8 from "../src/index";

describe("afterMove", () => {
  beforeEach(() => configure({ react: react18(), pixi: pixi8() }));

  it("runs at commit for each child that a keyed reorder moves, and the last call sees the final order", () => {
    const calls: string[] = [];
    const labels = (parent: PIXI.Container) => parent.children.map(child => child.label).join("");
    const Node = PIXIComponent<PIXI.Container, { label: string }>("AfterMoveNode", {
      afterMove: node => calls.push(`${node.label}:${labels(node.parent!)}`),
      create: () => new PIXI.Container(),
    });
    const Scene = ({ order }: { order: string }) => (
      <Container>
        {[...order].map(key => (
          <Node key={key} label={key} />
        ))}
      </Container>
    );
    const root = new PIXI.Container();

    render(<Scene order="abc" />, root);
    expect(calls).toEqual([]);

    // React keeps `c` in place and moves `b`, then `a`, to the end.
    render(<Scene order="cba" />, root);
    expect(calls).toEqual(["b:acb", "a:cba"]);

    unmount(root);
  });

  it("keeps a result that each call computes again from the parent correct when a commit mixes moves, adds and removes", () => {
    const calls: string[] = [];
    const labels = (parent: PIXI.Container) => parent.children.map(child => child.label).join("");
    // The same pattern as the `afterMove` example in the README of the core.
    const stack = (hook: string, row: PIXI.Container, removed?: PIXI.Container) => {
      const parent = row.parent!;
      calls.push(`${hook} ${row.label}:${labels(parent)}`);
      let y = 0;
      for (const child of parent.children) {
        if (child === removed) continue;
        child.y = y;
        y += 40;
      }
    };
    const Row = PIXIComponent<PIXI.Container, { label: string }>("AfterMoveRow", {
      afterAdd: row => stack("add", row),
      afterMove: row => stack("move", row),
      beforeRemove: row => stack("remove", row, row),
      create: () => new PIXI.Container(),
    });
    const Scene = ({ order }: { order: string }) => (
      <Container>
        {[...order].map(key => (
          <Row key={key} label={key} />
        ))}
      </Container>
    );
    const root = new PIXI.Container();
    const positions = () => (root.children[0] as PIXI.Container).children.map(child => `${child.label}:${child.y}`);

    render(<Scene order="abcd" />, root);
    calls.length = 0;

    // React removes `b`, then places `x`, `y`, `c` and `a` in this order. Each call before the last sees an order
    // that is not the final order.
    render(<Scene order="xdyca" />, root);
    expect(calls).toEqual(["remove b:abcd", "add x:acxd", "add y:acxdy", "move c:axdyc", "move a:xdyca"]);
    expect(positions()).toEqual(["x:0", "d:40", "y:80", "c:120", "a:160"]);

    unmount(root);
  });
});
