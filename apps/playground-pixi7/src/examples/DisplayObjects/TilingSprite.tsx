import { type Texture } from "pixi.js";
import { useCallback, useState } from "react";
import { Stage, TilingSprite, usePixiTicker } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

function Tiles({ texture }: { texture: Texture }) {
  const [offset, setOffset] = useState(0);
  usePixiTicker(useCallback((delta: number) => setOffset(current => current + delta), []));
  return <TilingSprite height={300} texture={texture} tilePosition={{ x: offset, y: offset / 2 }} width={400} />;
}

export default function TilingSpriteExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {texture && <Tiles texture={texture} />}
    </Stage>
  );
}
