import { Assets, Spritesheet, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { AnimatedSprite, Stage } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

export default function AnimatedSpriteExample() {
  const [textures, setTextures] = useState<Texture[]>();
  useEffect(() => {
    let cancelled = false;
    bunnySheet.then(sheet => {
      if (cancelled) return;
      setTextures(bunnyNames.map(name => sheet.textures[name]));
    });
    return () => {
      cancelled = true;
    };
  }, []);
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
