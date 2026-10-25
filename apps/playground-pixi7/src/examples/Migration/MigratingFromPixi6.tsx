import { Rectangle, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Container, Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

export default function MigratingFromPixi6Example() {
  const [texture, setTexture] = useState<Texture>();
  const [scale, setScale] = useState(3);
  const [pointer, setPointer] = useState("move the pointer");
  useEffect(() => {
    const bunny = new Texture(Texture.from(bunnys).baseTexture, new Rectangle(2, 47, 26, 37));
    setTexture(bunny);
    return () => {
      bunny.destroy();
    };
  }, []);
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
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
