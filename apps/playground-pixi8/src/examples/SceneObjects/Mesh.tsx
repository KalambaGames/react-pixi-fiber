import { Assets, PlaneGeometry, Rectangle, Texture } from "pixi.js";
import { useEffect, useMemo, useState } from "react";
import { Mesh, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

export default function MeshExample() {
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
  const geometry = useMemo(() => new PlaneGeometry({ height: 148, verticesX: 2, verticesY: 2, width: 104 }), []);
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {texture && <Mesh geometry={geometry} texture={texture} x={148} y={76} />}
    </Stage>
  );
}
