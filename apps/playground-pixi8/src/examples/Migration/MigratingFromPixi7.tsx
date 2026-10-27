import { Assets, Spritesheet, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Container, Stage, TilingSprite } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

export default function MigratingFromPixi7Example() {
  const [texture, setTexture] = useState<Texture>();
  const [tint, setTint] = useState(0xffffff);
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
          <TilingSprite
            anchor={0.5}
            buttonMode
            height={150}
            interactive
            name="tiles"
            onpointerdown={() => setTint(current => (current === 0xffffff ? 0xffaa66 : 0xffffff))}
            texture={texture}
            tint={tint}
            uvRespectAnchor
            width={200}
            x={200}
            y={150}
          />
        </Container>
      )}
    </Stage>
  );
}
