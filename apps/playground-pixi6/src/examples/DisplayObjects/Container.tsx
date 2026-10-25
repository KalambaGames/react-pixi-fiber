import { Rectangle, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Container, Sprite, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

export default function ContainerExample() {
  const [texture, setTexture] = useState<Texture>();
  useEffect(() => {
    let cancelled = false;
    let bunny: Texture | undefined;
    Texture.fromURL(bunnys).then(sheet => {
      if (cancelled) return;
      bunny = new Texture(sheet.baseTexture, new Rectangle(2, 47, 26, 37));
      setTexture(bunny);
    });
    return () => {
      cancelled = true;
      bunny?.destroy();
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
