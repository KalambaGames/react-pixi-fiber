import { PerspectiveMesh } from "@react-pixi-fiber/pixi-8";
import { Assets, Rectangle, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

export default function PerspectiveMeshExample() {
  const [texture, setTexture] = useState<Texture>();
  useEffect(() => {
    let cancelled = false;
    let bunny: Texture | undefined;
    Assets.load<Texture>(bunnys).then(sheet => {
      if (cancelled) return;
      bunny = new Texture({ frame: new Rectangle(2, 47, 26, 37), source: sheet.source });
      setTexture(bunny);
    });
    return () => {
      cancelled = true;
      bunny?.destroy();
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
