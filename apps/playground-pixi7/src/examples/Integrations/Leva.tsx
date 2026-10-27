import { useControls } from "leva";
import type { Sprite as PixiSprite } from "pixi.js";
import { BaseTexture, Point, SCALE_MODES, Spritesheet, type Texture } from "pixi.js";
import { type RefObject, useRef } from "react";
import { Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

const centerAnchor = new Point(0.5, 0.5);
const sheet = new Spritesheet(BaseTexture.from(bunnys), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse();

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
const textures = bunnyNames.map(name => sheet.textures[name]);

function Bunnies({ count, speed, tint }: { count: number; speed: RefObject<number>; tint: number }) {
  const sprites = useRef<PixiSprite[]>([]);
  const data = useRef<{ texture: Texture; vx: number; vy: number; x: number; y: number }[]>([]);
  // The bunnies keep their position and speed, so a new count only adds or removes bunnies at the end.
  while (data.current.length < count) {
    data.current.push({
      texture: textures[data.current.length % textures.length],
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 4 - 2,
      x: 20 + Math.random() * 360,
      y: 60 + Math.random() * 220,
    });
  }
  data.current.length = count;
  const bunnies = data.current;

  // The ticker reads the speed from the ref, so a speed change does not re-render the bunnies.
  usePixiTicker(() => {
    bunnies.forEach((bunny, index) => {
      const sprite = sprites.current[index];
      if (!sprite) return;
      if (sprite.x < 13 || sprite.x > 387) bunny.vx *= -1;
      if (sprite.y < 58 || sprite.y > 281) bunny.vy *= -1;
      sprite.position.set(sprite.x + bunny.vx * speed.current, sprite.y + bunny.vy * speed.current);
    });
  });

  return bunnies.map((bunny, index) => (
    <Sprite
      anchor={centerAnchor}
      key={index}
      ref={sprite => {
        if (sprite) sprites.current[index] = sprite;
      }}
      texture={bunny.texture}
      tint={tint}
      x={bunny.x}
      y={bunny.y}
    />
  ));
}

export default function LevaExample() {
  // Counts the renders of this component, to show which controls re-render it.
  const renders = useRef(0);
  renders.current += 1;
  // useControls returns values, so a change of count or tint re-renders the component.
  const { count, tint } = useControls({ count: { max: 300, min: 1, step: 1, value: 40 }, tint: "#ffffff" });
  // A control with onChange is transient: it writes to the ref and does not re-render.
  const speed = useRef(1);
  useControls({
    speed: {
      max: 5,
      min: 0,
      onChange: (value: number) => {
        speed.current = value;
      },
      value: 1,
    },
  });

  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text={`React renders: ${renders.current}\ncount and tint re-render, speed does not`}
        x={10}
        y={8}
      />
      <Bunnies count={count} speed={speed} tint={Number.parseInt(tint.slice(1), 16)} />
    </Stage>
  );
}
