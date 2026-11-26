import { type Fog, Material3D, PlaneGeometry } from "@pixi/3d";
import { BufferImageSource, Matrix, Texture } from "pixi.js";

import { Mesh3D } from "@react-pixi-fiber/pixi3d-0";

// The floor is 400 units across, so it reaches past the horizon. One cell of the checker is one unit.
const size = 400;
const dark = [0x7a, 0x7f, 0x89, 0xff];
const light = [0x8a, 0x8f, 0x99, 0xff];
// Two by two pixels, one pixel a cell. "repeat" tiles it, "nearest" keeps the cell edges sharp.
const checker = new Texture({
  source: new BufferImageSource({
    addressMode: "repeat",
    height: 2,
    resource: new Uint8Array([...dark, ...light, ...light, ...dark]),
    scaleMode: "nearest",
    width: 2,
  }),
});
const geometry = new PlaneGeometry();
const material = new Material3D({
  baseColorTexture: checker,
  roughness: 1,
  uvTransform: new Matrix().scale(size / 2, size / 2),
});

// The fog has the colour of the stage background, so the floor fades into it before its edge.
export const fog: Fog = { color: 0x1099bb, far: 80, near: 20, type: "linear" };

export function Floor({ y = 0 }: { y?: number }) {
  // The floor casts no shadow: a 400 unit caster would stretch the box that a sun fits to its casters,
  // and blur every shadow.
  return (
    <Mesh3D
      castShadow={false}
      geometry={geometry}
      material={material}
      position={[0, y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={size}
    />
  );
}
