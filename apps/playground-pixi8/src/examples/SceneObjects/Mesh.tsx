import { Assets, PlaneGeometry, Spritesheet, Texture } from "pixi.js";
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
  const geometry = useMemo(() => new PlaneGeometry({ height: 148, verticesX: 2, verticesY: 2, width: 104 }), []);
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {texture && <Mesh geometry={geometry} texture={texture} x={148} y={76} />}
    </Stage>
  );
}
