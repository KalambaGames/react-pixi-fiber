import { PerspectiveMesh } from "@react-pixi-fiber/pixi-8";
import { Assets, Spritesheet, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Stage } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

export default function PerspectiveMeshExample() {
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
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {texture && (
        <PerspectiveMesh texture={texture} x0={100} x1={300} x2={240} x3={160} y0={40} y1={80} y2={250} y3={270} />
      )}
    </Stage>
  );
}
