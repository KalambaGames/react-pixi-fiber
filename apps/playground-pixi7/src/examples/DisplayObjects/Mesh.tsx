import { MeshMaterial, PlaneGeometry } from "pixi.js";
import { useMemo } from "react";
import { Mesh, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

export default function MeshExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  const geometry = useMemo(() => new PlaneGeometry(104, 148, 2, 2), []);
  // In PixiJS 7 a Mesh gets its texture from its shader.
  const shader = useMemo(() => texture && new MeshMaterial(texture), [texture]);
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {shader && <Mesh geometry={geometry} shader={shader} x={148} y={76} />}
    </Stage>
  );
}
