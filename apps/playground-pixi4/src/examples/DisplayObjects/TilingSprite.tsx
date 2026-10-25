import { Rectangle, Texture } from "pixi.js";
import { useCallback, useEffect, useState } from "react";
import { Stage, TilingSprite, usePixiTicker } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

// PixiJS 4 has no Texture.fromURL. The texture from Texture.fromImage loads in the background.
function fromURL(url: string) {
  const texture = Texture.fromImage(url);
  return new Promise<Texture>(resolve => {
    if (texture.baseTexture.hasLoaded) resolve(texture);
    else texture.baseTexture.once("loaded", () => resolve(texture));
  });
}

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
    fromURL(bunnys).then(sheet => {
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
