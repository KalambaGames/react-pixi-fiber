import { PerspectiveMesh } from "@react-pixi-fiber/pixi-8";
import { Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

export default function PerspectiveMeshExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {texture && (
        <PerspectiveMesh texture={texture} x0={100} x1={300} x2={240} x3={160} y0={40} y1={80} y2={250} y3={270} />
      )}
    </Stage>
  );
}
