import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import * as PIXI from "pixi.js";
import react18 from "@react-pixi-fiber/react-18";
import { configure, render, Sprite } from "react-pixi-fiber";
import pixi8 from "../src/index";

// The texture is 1 by 1, so a width of 100 is a scale of 100, and a restored scale is a width of 1.
const texture = PIXI.Texture.WHITE;

describe("a prop set to undefined after a prop whose setter writes it", () => {
  let root: PIXI.Container;
  beforeEach(() => {
    configure({ react: react18(), pixi: pixi8() });
    root = new PIXI.Container();
  });

  function show(element: React.ReactElement) {
    render(<React.StrictMode>{element}</React.StrictMode>, root);
    return root.children[0] as PIXI.Sprite;
  }

  it("keeps the new width of a Sprite when the same update sets scale to undefined", () => {
    const sprite = show(<Sprite texture={texture} scale={2} />);
    show(<Sprite texture={texture} width={100} scale={undefined} />);
    expect(sprite.width).toBe(100);
  });

  it("does not record the scale that width wrote as the default, when a new Sprite has an undefined scale", () => {
    const sprite = show(<Sprite texture={texture} width={100} scale={undefined} />);
    expect(sprite.width).toBe(100);
    show(<Sprite texture={texture} />);
    expect(sprite.scale.x).toBe(1);
  });
});
