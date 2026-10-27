import { type SimpleMesh, Spritesheet, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { MeshSimple, Stage } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Texture.fromURL(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
const vertices = new Float32Array([100, 50, 300, 80, 280, 250, 120, 220]) as unknown as SimpleMesh["vertices"];

// PixiJS 6 class: SimpleMesh
export default function MeshSimpleExample() {
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
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {texture && <MeshSimple indices={indices} texture={texture} uvs={uvs} vertices={vertices} />}
    </Stage>
  );
}
