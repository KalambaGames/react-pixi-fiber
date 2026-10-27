import { Spritesheet, Texture } from "pixi.js";
import { useCallback, useEffect, useState } from "react";
import { Stage, TilingSprite, usePixiTicker } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Texture.fromURL(bunnys).then(texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  // parse fills sheet.textures before it returns, for a sheet this small.
  // The documented way waits for parse: see the Features / Spritesheet example.
  sheet.parse(() => {});
  return sheet;
});

function Tiles({ texture }: { texture: Texture }) {
  const [offset, setOffset] = useState(0);
  usePixiTicker(useCallback((delta: number) => setOffset(current => current + delta), []));
  return <TilingSprite height={300} texture={texture} tilePosition={{ x: offset, y: offset / 2 }} width={400} />;
}

export default function TilingSpriteExample() {
  const [texture, setTexture] = useState<Texture>();
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
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {texture && <Tiles texture={texture} />}
    </Stage>
  );
}
