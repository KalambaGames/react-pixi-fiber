import { Particle } from "@react-pixi-fiber/pixi-8";
import { type Texture } from "pixi.js";
import { useCallback, useState } from "react";
import { ParticleContainer, Stage, usePixiTicker } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

const createBunnies = () =>
  Array.from({ length: 200 }, (_, id) => ({
    id,
    speed: 1 + Math.random() * 3,
    x: Math.random() * 400,
    y: Math.random() * 300,
  }));

function Bunnies({ texture }: { texture: Texture }) {
  const [bunnies, setBunnies] = useState(createBunnies);
  usePixiTicker(
    useCallback(ticker => {
      setBunnies(list => list.map(b => ({ ...b, x: (b.x + b.speed * ticker.deltaTime) % 400 })));
    }, [])
  );
  return (
    <ParticleContainer dynamicProperties={{ position: true }} texture={texture}>
      {bunnies.map(b => (
        <Particle key={b.id} texture={texture} x={b.x} y={b.y} />
      ))}
    </ParticleContainer>
  );
}

export default function ParticleContainerExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {texture && <Bunnies texture={texture} />}
    </Stage>
  );
}
