import { Texture } from "pixi.js";
import { useMemo } from "react";
import { AnimatedSprite, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

export default function AnimatedSpriteExample() {
  const { textures: frames } = useSpritesheet(bunnys, bunnysData);
  const textures = useMemo(() => frames.bunny && bunnyNames.map(name => frames[name] as Texture), [frames]);
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {textures && (
        <AnimatedSprite
          anchor={{ x: 0.5, y: 1 }}
          animationSpeed={0.1}
          ref={sprite => sprite?.play()}
          scale={4}
          textures={textures}
          x={200}
          y={224}
        />
      )}
    </Stage>
  );
}
