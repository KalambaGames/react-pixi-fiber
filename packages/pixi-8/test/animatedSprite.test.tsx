import { describe, it, expect } from "vitest";
import React from "react";
import renderer, { act } from "react-test-renderer";
import * as PIXI from "pixi.js";
import react18 from "@react-pixi-fiber/react-18";
import { AnimatedSprite, configure, Stage } from "react-pixi-fiber";
import pixi8 from "../src/index";

// Renders `child` on a Stage and returns the sprite and a function that renders the next child.
async function mount(child: React.ReactElement) {
  configure({ react: react18(), pixi: pixi8() });
  let app: PIXI.Application | null = null;
  const element = (next: React.ReactElement) => (
    <Stage
      onInit={a => {
        app = a as PIXI.Application;
      }}
      options={{ height: 8, width: 8 }}
    >
      {next}
    </Stage>
  );
  const tree = renderer.create(element(child), { createNodeMock: () => document.createElement("canvas") });
  await act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });
  const sprite = () => app!.stage.children[0] as PIXI.AnimatedSprite;
  const update = (next: React.ReactElement) => act(() => tree.update(element(next)));
  return { sprite, tree, update };
}

describe("pixi8() AnimatedSprite", () => {
  const texture = PIXI.Texture.WHITE;
  it("keeps playing from frame 0 after a textures change", async () => {
    const { sprite, tree, update } = await mount(<AnimatedSprite playing textures={[texture, texture, texture]} />);
    expect(sprite().playing).toBe(true);
    sprite().gotoAndPlay(2);
    update(<AnimatedSprite playing textures={[texture, texture]} />);
    expect(sprite().playing).toBe(true);
    expect(sprite().currentFrame).toBe(0);
    update(<AnimatedSprite playing={false} textures={[texture, texture]} />);
    expect(sprite().playing).toBe(false);
    act(() => tree.unmount());
  });
  it("keeps a sprite that a ref started playing after a textures change", async () => {
    const { sprite, tree, update } = await mount(<AnimatedSprite textures={[texture, texture, texture]} />);
    sprite().play();
    update(<AnimatedSprite textures={[texture, texture]} />);
    expect(sprite().playing).toBe(true);
    act(() => tree.unmount());
  });
});
