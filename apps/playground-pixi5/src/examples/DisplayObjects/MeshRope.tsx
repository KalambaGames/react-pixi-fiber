import { Point, Spritesheet, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { MeshRope, Stage } from "react-pixi-fiber";
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

const points = Array.from({ length: 20 }, (_, i) => new Point(40 + i * 17, 150 + Math.sin(i / 2) * 50));

// PixiJS 5 class: SimpleRope
export default function MeshRopeExample() {
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
      {texture && <MeshRope points={points} texture={texture} />}
    </Stage>
  );
}
