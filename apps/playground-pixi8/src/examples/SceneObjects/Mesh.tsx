import { PlaneGeometry } from "pixi.js";
import { useMemo } from "react";
import { Mesh, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

export default function MeshExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  const geometry = useMemo(() => new PlaneGeometry({ height: 148, verticesX: 2, verticesY: 2, width: 104 }), []);
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {texture && <Mesh geometry={geometry} texture={texture} x={148} y={76} />}
    </Stage>
  );
}
