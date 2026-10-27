import { mesh, Spritesheet, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { MeshSimple, Stage } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

// PixiJS 4 has no Texture.fromURL. The texture from Texture.fromImage loads in the background.
function fromURL(url: string) {
  const texture = Texture.fromImage(url);
  return new Promise<Texture>(resolve => {
    if (texture.baseTexture.hasLoaded) resolve(texture);
    else texture.baseTexture.once("loaded", () => resolve(texture));
  });
}

const bunnySheet = fromURL(bunnys).then(texture => {
  const sheet = new Spritesheet(texture.baseTexture, bunnysData);
  // parse fills sheet.textures before it returns, for a sheet this small.
  // The documented way waits for parse: see the Features / Spritesheet example.
  sheet.parse(() => {});
  return sheet;
});

const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
// With uploadUvTransform the uvs cover the texture frame, not the whole sheet.
const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
const vertices = new Float32Array([100, 50, 300, 80, 280, 250, 120, 220]);

// PixiJS 4 class: mesh.Mesh, the same class as Mesh
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
