import { mesh } from "pixi.js";
import { MeshSimple, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
// With uploadUvTransform the uvs cover the texture frame, not the whole sheet.
const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
const vertices = new Float32Array([100, 50, 300, 80, 280, 250, 120, 220]);

// PixiJS 4 class: mesh.Mesh, the same class as Mesh
export default function MeshSimpleExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {texture && (
        <MeshSimple
          drawMode={mesh.Mesh.DRAW_MODES.TRIANGLES}
          indices={indices}
          texture={texture}
          uploadUvTransform
          uvs={uvs}
          vertices={vertices}
        />
      )}
    </Stage>
  );
}
