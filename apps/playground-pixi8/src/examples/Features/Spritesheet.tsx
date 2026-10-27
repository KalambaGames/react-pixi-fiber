import { Assets, Spritesheet, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Container, Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

// TexturePacker "hash" format: each frame is a rectangle in bunnys.png.
// The other examples import the same data from ./assets/bunnys.json.
const bunnysData = {
  frames: {
    bunnyAstronaut: { frame: { x: 2, y: 2, w: 26, h: 43 } },
    bunny: { frame: { x: 2, y: 47, w: 26, h: 37 } },
    bunnyCute: { frame: { x: 2, y: 86, w: 26, h: 37 } },
    bunnySporty: { frame: { x: 2, y: 125, w: 26, h: 37 } },
    bunnyRobot: { frame: { x: 2, y: 164, w: 26, h: 37 } },
  },
  meta: {
    image: "bunnys.png",
    size: { w: 30, h: 203 },
    scale: "1",
  },
};

// PixiJS 8 loads the image asynchronously, then parses the frames.
const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

function Bunnies() {
  const [textures, setTextures] = useState<Record<string, Texture>>();

  useEffect(() => {
    let cancelled = false;
    bunnySheet.then(sheet => {
      if (!cancelled) setTextures(sheet.textures);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!textures) return null;

  // The frame names are the keys of sheet.textures.
  return Object.entries(textures).map(([name, texture], i) => (
    <Container key={name} x={48 + i * 76} y={150}>
      <Sprite anchor={{ x: 0.5, y: 1 }} scale={2} texture={texture} />
      <Text anchor={{ x: 0.5, y: 0 }} style={{ fill: 0xffffff, fontSize: 11 }} text={name} y={8} />
    </Container>
  ));
}

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

function SpritesheetExample() {
  return (
    <Stage options={OPTIONS}>
      <Bunnies />
    </Stage>
  );
}

export default SpritesheetExample;
