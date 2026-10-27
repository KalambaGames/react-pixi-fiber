import { mesh } from "pixi.js";
import { Mesh, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

// A quad of two triangles. With uploadUvTransform the uvs cover the texture frame, not the whole sheet.
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
const vertices = new Float32Array([0, 0, 104, 0, 104, 148, 0, 148]);

// PixiJS 4 class: mesh.Mesh
export default function MeshExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {texture && (
        <Mesh
          drawMode={mesh.Mesh.DRAW_MODES.TRIANGLES}
          indices={indices}
          texture={texture}
          uploadUvTransform
          uvs={uvs}
          vertices={vertices}
          x={148}
          y={76}
        />
      )}
    </Stage>
  );
}
