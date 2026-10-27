// Every filter and every parameter: https://pixijs.io/filters/examples/
import { ShockwaveFilter as PixiShockwaveFilter } from "pixi-filters";
import { BaseTexture, Rectangle, SCALE_MODES, settings, Spritesheet } from "pixi.js";
import { useRef } from "react";
import { Container, PIXIFilter, Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const ShockwaveFilter = PIXIFilter(
  "ShockwaveFilter",
  ({ center, ...options }: { amplitude?: number; center?: number[]; wavelength?: number }) =>
    new PixiShockwaveFilter(center, options)
);

const sheet = new Spritesheet(BaseTexture.fromImage(bunnys), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse(() => {});

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
const textures = bunnyNames.map(name => sheet.textures[name]);
const center = [200, 150];
const stageArea = new Rectangle(0, 0, 400, 300);
const grid = Array.from({ length: 40 }, (_, index) => ({
  x: 25 + (index % 8) * 50,
  y: 50 + Math.floor(index / 8) * 50,
}));

function Bunnies() {
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

  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Bunnies />
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text={`React renders: ${renders.current}\nThe ticker moves the wave without a render`}
        x={10}
        y={8}
      />
    </Stage>
  );
}
