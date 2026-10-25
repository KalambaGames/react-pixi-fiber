import { Assets, Rectangle, Texture } from "pixi.js";
import { useCallback, useEffect, useState } from "react";
import { Stage, TilingSprite, usePixiTicker } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

function Tiles({ texture }: { texture: Texture }) {
  const [offset, setOffset] = useState(0);
  usePixiTicker(useCallback(ticker => setOffset(current => current + ticker.deltaTime), []));
  return <TilingSprite height={300} texture={texture} tilePosition={{ x: offset, y: offset / 2 }} width={400} />;
}

export default function TilingSpriteExample() {
  const [texture, setTexture] = useState<Texture>();
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
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>{texture && <Tiles texture={texture} />}</Stage>
  );
}
