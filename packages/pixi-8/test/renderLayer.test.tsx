import * as PIXI from "pixi.js";
import React, { useLayoutEffect, useRef } from "react";
import { describe, expect, it } from "vitest";

import { Container, configure, render, Sprite, unmount } from "react-pixi-fiber";
import react18 from "@react-pixi-fiber/react-18";

import pixi8, { RenderLayer } from "../src/index";

describe("RenderLayer", () => {
  it("draws the objects attached through refs and keeps them in the scene graph", () => {
    configure({ react: react18(), pixi: pixi8() });
    const Scene = () => {
      const layer = useRef<PIXI.RenderLayer>(null);
      const sprite = useRef<PIXI.Sprite>(null);
      useLayoutEffect(() => {
        const [target, child] = [layer.current!, sprite.current!];
        target.attach(child);
        return () => {
          target.detach(child);
        };
      }, []);
      return (
        <Container>
          <Container>
            <Sprite ref={sprite} texture={PIXI.Texture.WHITE} />
          </Container>
          <RenderLayer ref={layer} />
        </Container>
      );
    };
    const root = new PIXI.Container();
    render(<Scene />, root);
    const [group, layer] = root.children[0].children as [PIXI.Container, PIXI.RenderLayer];
    const sprite = group.children[0];
    expect(layer).toBeInstanceOf(PIXI.RenderLayer);
    expect(layer.renderLayerChildren).toEqual([sprite]);
    expect(sprite.parentRenderLayer).toBe(layer);
    unmount(root);
    expect(layer.renderLayerChildren).toEqual([]);
  });
});
