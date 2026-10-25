import { Assets, Rectangle, Texture } from "pixi.js";
import { useCallback, useEffect, useState } from "react";
import { Stage, TilingSprite, usePixiTicker } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

function Tiles({ texture }: { texture: Texture }) {
  const [offset, setOffset] = useState(0);
  usePixiTicker(useCallback((delta: number) => setOffset(current => current + delta), []));
  return <TilingSprite height={300} texture={texture} tilePosition={{ x: offset, y: offset / 2 }} width={400} />;
}

export default function TilingSpriteExample() {
  const [texture, setTexture] = useState<Texture>();
  useEffect(() => {
    let cancelled = false;
    let bunny: Texture | undefined;
    Assets.load<Texture>(bunnys).then(sheet => {
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
      {texture && <Tiles texture={texture} />}
    </Stage>
  );
}
