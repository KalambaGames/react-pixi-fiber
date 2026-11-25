import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import * as PIXI from "pixi.js";
import react18 from "@react-pixi-fiber/react-18";
import { configure, Container, PIXIComponent, render, unmount } from "react-pixi-fiber";
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
});
