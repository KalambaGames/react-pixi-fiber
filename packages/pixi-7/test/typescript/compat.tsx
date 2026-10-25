// Type-checked by `check-types`, not run: the compat module's typings accept the translated props on every tag.
import React from "react";
import * as PIXI from "pixi.js";
import { Container, Sprite } from "react-pixi-fiber";
import compat from "../../src/compat/pixi6";
import pixi7 from "../../src/index";

export const adapter = pixi7({ compat });

export const sprite = (
  <Sprite
    buttonMode
    click={(event: PIXI.FederatedPointerEvent) => event.stopPropagation()}
    interactive
    name="bunny"
    texture={PIXI.Texture.WHITE}
  />
);
export const container = <Container interactive={false} pointerdown={event => event.global} />;

// @ts-expect-error `buttonMode` takes a boolean.
export const invalidButtonMode = <Sprite buttonMode="yes" />;
// @ts-expect-error `click` takes an event handler.
export const invalidClick = <Sprite click={1} />;
