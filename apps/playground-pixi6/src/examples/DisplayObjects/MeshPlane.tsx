import { Rectangle, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { MeshPlane, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

// PixiJS 6 class: SimplePlane
export default function MeshPlaneExample() {
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
      {texture && <MeshPlane texture={texture} verticesX={10} verticesY={10} x={148} y={76} />}
    </Stage>
  );
}
