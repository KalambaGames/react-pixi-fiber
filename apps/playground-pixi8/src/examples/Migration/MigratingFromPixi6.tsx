import { Assets, Spritesheet, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Container, Sprite, Stage, Text } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

export default function MigratingFromPixi6Example() {
  const [texture, setTexture] = useState<Texture>();
  const [scale, setScale] = useState(3);
  const [pointer, setPointer] = useState("move the pointer");
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
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {texture && (
        <Container name="scene">
          <Sprite
            anchor={0.5}
            buttonMode
            click={() => setScale(current => current * 1.25)}
            interactive
            name="bunny"
            pointermove={e => setPointer(`${Math.round(e.global.x)}, ${Math.round(e.global.y)}`)}
            scale={scale}
            texture={texture}
            x={200}
            y={150}
          />
          <Text style={{ fill: "white", fontSize: 14 }} text={pointer} x={10} y={10} />
        </Container>
      )}
    </Stage>
  );
}
