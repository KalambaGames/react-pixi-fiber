import { Assets, Point, Rectangle, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { MeshRope, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

const points = Array.from({ length: 20 }, (_, i) => new Point(40 + i * 17, 150 + Math.sin(i / 2) * 50));

export default function MeshRopeExample() {
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
      {texture && <MeshRope points={points} texture={texture} />}
    </Stage>
  );
}
