// Type-checked by `check-types`, not run.

import * as PIXI from "pixi.js";
import React from "react";

import { ParticleContainer } from "react-pixi-fiber";

import { Particle, type ParticleContainerProps } from "../../src/index";

const texture = PIXI.Texture.WHITE;

export const particles = (
  <ParticleContainer dynamicProperties={{ position: true }} texture={texture}>
    <Particle anchorX={0.5} texture={texture} />
    {/* @ts-expect-error a Particle has anchorX and anchorY, no anchor point */}
    <Particle anchor={{ x: 0.5, y: 0.5 }} texture={texture} />
  </ParticleContainer>
);
export const containerProps: ParticleContainerProps = { dynamicProperties: { color: true }, roundPixels: true };
