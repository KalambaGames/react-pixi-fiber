import Matter from "matter-js";
import type { Sprite as PixiSprite } from "pixi.js";
import { BaseTexture, Point, SCALE_MODES, Spritesheet, Texture } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

const centerAnchor = new Point(0.5, 0.5);
const scale = 1.5;
// The engine steps in fixed steps of 1/60 s, so the simulation runs at the same speed at any frame rate.
const step = 1000 / 60;
const sheet = new Spritesheet(BaseTexture.from(bunnys), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse();

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
const textures = bunnyNames.map(name => sheet.textures[name]);

type Bunny = { body: Matter.Body; id: number; texture: Texture };

function World() {
  const [engine] = useState(() => Matter.Engine.create());
  const [bunnies, setBunnies] = useState<Bunny[]>([]);
  const sprites = useRef(new Map<number, PixiSprite>());
  const lastTime = useRef<number | null>(null);
  const lag = useRef(0);

  useEffect(() => {
    const options = { isStatic: true };
    Matter.Composite.add(engine.world, [
      Matter.Bodies.rectangle(200, 320, 400, 40, options),
      Matter.Bodies.rectangle(-20, 150, 40, 300, options),
      Matter.Bodies.rectangle(420, 150, 40, 300, options),
    ]);
    return () => Matter.Engine.clear(engine);
  }, [engine]);

  // Each frame runs as many steps as the time since the last frame needs. The sprites follow their bodies through
  // refs, without a re-render.
  usePixiTicker(() => {
    const now = performance.now();
    // A long pause, such as a hidden tab, counts as at most 0.1 s, so the engine does not run hundreds of steps at once.
    lag.current += Math.min(now - (lastTime.current ?? now), 100);
    lastTime.current = now;
    while (lag.current >= step) {
      Matter.Engine.update(engine, step);
      lag.current -= step;
    }
    for (const { body, id } of bunnies) {
      const sprite = sprites.current.get(id);
      if (!sprite) continue;
      sprite.position.set(body.position.x, body.position.y);
      sprite.rotation = body.angle;
    }
  });

  const drop = (x: number, y: number) => {
    const texture = textures[bunnies.length % textures.length];
    const body = Matter.Bodies.rectangle(x, y, texture.width * scale, texture.height * scale, { restitution: 0.4 });
    Matter.Composite.add(engine.world, body);
    setBunnies(previous => [...previous, { body, id: body.id, texture }]);
  };

  return (
    <>
      <Sprite
        eventMode="static"
        height={300}
        onpointerdown={event => drop(event.global.x, event.global.y)}
        texture={Texture.EMPTY}
        width={400}
      />
      {bunnies.map(({ body, id, texture }) => (
        <Sprite
          anchor={centerAnchor}
          key={id}
          ref={sprite => {
            if (sprite) sprites.current.set(id, sprite);
            else sprites.current.delete(id);
          }}
          scale={scale}
          texture={texture}
          x={body.position.x}
          y={body.position.y}
        />
      ))}
    </>
  );
}

export default function MatterJSExample() {
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text
        anchor={centerAnchor}
        style={{ fill: "white", fontFamily: "Arial", fontSize: 18 }}
        text="Click to drop bunnies"
        x={200}
        y={30}
      />
      <World />
    </Stage>
  );
}
