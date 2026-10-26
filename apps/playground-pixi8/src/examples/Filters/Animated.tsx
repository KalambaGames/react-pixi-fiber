// Every filter and every parameter: https://pixijs.io/filters/examples/
import { ShockwaveFilter as PixiShockwaveFilter, type ShockwaveFilterOptions } from "pixi-filters";
import { Assets, Rectangle, Texture, TextureSource } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Container, PIXIFilter, Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

TextureSource.defaultOptions.scaleMode = "nearest";

const ShockwaveFilter = PIXIFilter(
  "ShockwaveFilter",
  (props: ShockwaveFilterOptions) => new PixiShockwaveFilter(props)
);

const center = { x: 200, y: 150 };
const stageArea = new Rectangle(0, 0, 400, 300);
const grid = Array.from({ length: 40 }, (_, index) => ({
  x: 25 + (index % 8) * 50,
  y: 50 + Math.floor(index / 8) * 50,
}));

function Bunnies({ textures }: { textures: Texture[] }) {
  const wave = useRef<PixiShockwaveFilter>(null);

  // The ticker writes the time on the filter itself, so the wave moves without a React render.
  usePixiTicker(() => {
    if (!wave.current) return;
    wave.current.time = wave.current.time >= 1.5 ? 0 : wave.current.time + 0.01;
  });

  return (
    <Container filterArea={stageArea}>
      <ShockwaveFilter amplitude={20} center={center} ref={wave} wavelength={120} />
      {grid.map(({ x, y }, index) => (
        <Sprite key={index} texture={textures[index % textures.length]} x={x} y={y} />
      ))}
    </Container>
  );
}

export default function AnimatedExample() {
  // Counts the renders of this component, to show that the animation does not re-render it.
  const renders = useRef(0);
  renders.current += 1;
  const [textures, setTextures] = useState<Texture[]>();

  // PixiJS 8 loads the sprite sheet asynchronously, so the bunnies render once their textures exist.
  useEffect(() => {
    let cancelled = false;
    let created: Texture[] = [];
    Assets.load<Texture>(bunnys).then(({ source }) => {
      if (cancelled) return;
      created = [
        new Texture({ frame: new Rectangle(2, 47, 26, 37), source }),
        new Texture({ frame: new Rectangle(2, 86, 26, 37), source }),
        new Texture({ frame: new Rectangle(2, 125, 26, 37), source }),
        new Texture({ frame: new Rectangle(2, 164, 26, 37), source }),
        new Texture({ frame: new Rectangle(2, 2, 26, 43), source }),
      ];
      setTextures(created);
    });
    return () => {
      cancelled = true;
      for (const texture of created) texture.destroy();
    };
  }, []);

  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {textures && <Bunnies textures={textures} />}
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text={`React renders: ${renders.current}\nThe ticker moves the wave without a render`}
        x={10}
        y={8}
      />
    </Stage>
  );
}
