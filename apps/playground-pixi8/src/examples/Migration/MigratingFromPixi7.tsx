import { Assets, Rectangle, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Container, Stage, TilingSprite } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

export default function MigratingFromPixi7Example() {
  const [texture, setTexture] = useState<Texture>();
  const [tint, setTint] = useState(0xffffff);
  useEffect(() => {
    let cancelled = false;
    let bunny: Texture | undefined;
    Assets.load<Texture>(bunnys).then(sheet => {
      if (cancelled) return;
      bunny = new Texture({ frame: new Rectangle(2, 47, 26, 37), source: sheet.source });
      setTexture(bunny);
    });
    return () => {
      cancelled = true;
      bunny?.destroy();
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
