import { useState } from "react";
import { Container, Stage, TilingSprite } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

export default function MigratingFromPixi7Example() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  const [tint, setTint] = useState(0xffffff);
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
