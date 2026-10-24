import { Assets, Rectangle, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { MeshPlane, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

export default function MeshPlaneExample() {
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
      {texture && <MeshPlane texture={texture} verticesX={10} verticesY={10} x={148} y={76} />}
    </Stage>
  );
}
