import { Assets, Rectangle, type SimpleMesh, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { MeshSimple, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
const vertices = new Float32Array([100, 50, 300, 80, 280, 250, 120, 220]) as unknown as SimpleMesh["vertices"];

// PixiJS 7 class: SimpleMesh
export default function MeshSimpleExample() {
  const [texture, setTexture] = useState<Texture>();
  useEffect(() => {
    let cancelled = false;
    let bunny: Texture | undefined;
    Assets.load<Texture>(bunnys).then(sheet => {
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
      {texture && <MeshSimple indices={indices} texture={texture} uvs={uvs} vertices={vertices} />}
    </Stage>
  );
}
