import { MeshGeometry, MeshMaterial, Rectangle, Texture } from "pixi.js";
import { useEffect, useMemo, useState } from "react";
import { Mesh, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

export default function MeshExample() {
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
  // PixiJS 5 has no PlaneGeometry, so the geometry is a quad of two triangles.
  const geometry = useMemo(
    () => new MeshGeometry([0, 0, 104, 0, 104, 148, 0, 148], [0, 0, 1, 0, 1, 1, 0, 1], [0, 1, 2, 0, 2, 3]),
    []
  );
  // In PixiJS 5 a Mesh gets its texture from its shader.
  const shader = useMemo(() => texture && new MeshMaterial(texture), [texture]);
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {shader && <Mesh geometry={geometry} shader={shader} x={148} y={76} />}
    </Stage>
  );
}
