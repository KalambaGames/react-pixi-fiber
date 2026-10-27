import { Assets, MeshMaterial, PlaneGeometry, Spritesheet, Texture } from "pixi.js";
import { useEffect, useMemo, useState } from "react";
import { Mesh, Stage } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

export default function MeshExample() {
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
  const geometry = useMemo(() => new PlaneGeometry(104, 148, 2, 2), []);
  // In PixiJS 7 a Mesh gets its texture from its shader.
  const shader = useMemo(() => texture && new MeshMaterial(texture), [texture]);
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {shader && <Mesh geometry={geometry} shader={shader} x={148} y={76} />}
    </Stage>
  );
}
