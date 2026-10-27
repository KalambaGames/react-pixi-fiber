import { Point } from "pixi.js";
import { MeshRope, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

const points = Array.from({ length: 20 }, (_, i) => new Point(40 + i * 17, 150 + Math.sin(i / 2) * 50));

// PixiJS 5 class: SimpleRope
export default function MeshRopeExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {texture && <MeshRope points={points} texture={texture} />}
    </Stage>
  );
}
