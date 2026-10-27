import { useState } from "react";
import { Container, Sprite, Stage, Text } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

export default function MigratingFromPixi6Example() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  const [scale, setScale] = useState(3);
  const [pointer, setPointer] = useState("move the pointer");
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Container name="scene">
        {texture && (
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
        )}
        <Text style={{ fill: "white", fontSize: 14 }} text={pointer} x={10} y={10} />
      </Container>
    </Stage>
  );
}
