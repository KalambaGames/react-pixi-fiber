import { Assets, Spritesheet, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Container, Sprite, Stage } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

export default function ContainerExample() {
  const [texture, setTexture] = useState<Texture>();
  useEffect(() => {
    let cancelled = false;
    bunnySheet.then(sheet => {
      if (cancelled) return;
      setTexture(sheet.textures.bunny);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {texture && (
        <Container x={200} y={150}>
          {[-80, 0, 80].map(x => (
            <Sprite anchor={0.5} key={x} texture={texture} x={x} />
          ))}
        </Container>
      )}
    </Stage>
  );
}
