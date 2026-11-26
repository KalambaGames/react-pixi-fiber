import type { ParticleBlendMode, ParticleContainer3D as PixiParticleContainer3D } from "@pixi/3d";
import { useControls } from "leva";
import { type Texture, TextureSource } from "pixi.js";
import { useMemo, useRef } from "react";

import { Stage, usePixiTicker } from "react-pixi-fiber";
import { Camera3D, DirectionalLight, OrbitCamera, ParticleContainer3D, View3D } from "@react-pixi-fiber/pixi3d-0";

import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { Floor, fog } from "./components/Floor";
import { useSpritesheet } from "./hooks/useSpritesheet";

TextureSource.defaultOptions.scaleMode = "nearest";

const capacity = 300;
const top = 8;
const blendModes: ParticleBlendMode[] = ["normal", "add", "screen", "multiply"];
const start: [number, number, number] = [0, 4, 10];
const target: [number, number, number] = [0, 3, 0];

// Particles fall and wrap to the top. The pool holds capacity slots, and a slot of size 0 draws nothing.
function Falling({ blendMode, count, texture }: { blendMode: ParticleBlendMode; count: number; texture: Texture }) {
  const particles = useRef<PixiParticleContainer3D>(null);
  // x, y, z and fall speed of each particle.
  const state = useMemo(() => {
    const data = new Float32Array(capacity * 4);
    for (let i = 0; i < capacity; i++) {
      data.set([Math.random() * 12 - 6, Math.random() * top, Math.random() * 12 - 6, 1 + Math.random()], i * 4);
    }
    return data;
  }, []);
  // usePixiTicker reads the application, so it runs in a child of the Stage.
  usePixiTicker(ticker => {
    const container = particles.current;
    if (!container) return;
    for (let i = 0; i < capacity; i++) {
      const o = i * 4;
      state[o + 1] -= (state[o + 3] * ticker.deltaMS) / 1000;
      if (state[o + 1] < 0) state[o + 1] += top;
      container.setParticleAt(i, state[o], state[o + 1], state[o + 2], i < count ? 0.6 : 0);
    }
    container.upload();
  });
  // texture and capacity are constructor-only: a new key makes a new container. blendMode is a plain prop.
  return <ParticleContainer3D ref={particles} blendMode={blendMode} capacity={capacity} texture={texture} />;
}

function Bunnys({ blendMode, count }: { blendMode: ParticleBlendMode; count: number }) {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  return textures.bunny ? <Falling blendMode={blendMode} count={count} texture={textures.bunny} /> : null;
}

export default function ParticleContainer3DExample() {
  const { blendMode, count } = useControls({
    blendMode: { options: blendModes, value: blendModes[0] },
    count: { max: capacity, min: 0, step: 1, value: 150 },
  });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={20} maxPolarAngle={1.45} minDistance={4} target={target} />
        {/* The light is for the floor: a particle draws its texture unlit. */}
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Bunnys blendMode={blendMode} count={count} />
        <Floor />
      </View3D>
    </Stage>
  );
}
