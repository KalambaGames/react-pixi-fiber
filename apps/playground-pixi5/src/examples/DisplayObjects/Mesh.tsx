import { MeshGeometry, MeshMaterial } from "pixi.js";
import { useMemo } from "react";
import { Mesh, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

export default function MeshExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  // PixiJS 5 has no PlaneGeometry, so the geometry is a quad of two triangles.
  const geometry = useMemo(
    () => new MeshGeometry([0, 0, 104, 0, 104, 148, 0, 148], [0, 0, 1, 0, 1, 1, 0, 1], [0, 1, 2, 0, 2, 3]),
    []
  );
  // In PixiJS 5 a Mesh gets its texture from its shader.
  const shader = useMemo(() => texture && new MeshMaterial(texture), [texture]);
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {shader && <Mesh geometry={geometry} shader={shader} x={148} y={76} />}
    </Stage>
  );
}
