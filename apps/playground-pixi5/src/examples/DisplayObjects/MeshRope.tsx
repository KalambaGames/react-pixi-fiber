import { Point, Rectangle, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { MeshRope, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

const points = Array.from({ length: 20 }, (_, i) => new Point(40 + i * 17, 150 + Math.sin(i / 2) * 50));

// PixiJS 5 class: SimpleRope
export default function MeshRopeExample() {
  const [texture, setTexture] = useState<Texture>();
  useEffect(() => {
    let cancelled = false;
    let bunny: Texture | undefined;
    Texture.fromURL(bunnys).then(sheet => {
      if (cancelled) return;
      bunny = new Texture(sheet.baseTexture, new Rectangle(2, 47, 26, 37));
      setTexture(bunny);
    });
    return () => {
      cancelled = true;
      bunny?.destroy();
    };
  }, []);
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {texture && <MeshRope points={points} texture={texture} />}
    </Stage>
  );
}
