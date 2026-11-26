import { CubeGeometry, Material3D, Matrix4, type BatchedMesh3D as PixiBatchedMesh3D, RenderPassBit } from "@pixi/3d";
import { useControls } from "leva";
import { useEffect, useRef } from "react";

import { Stage, usePixiTicker } from "react-pixi-fiber";
import { BatchedMesh3D, Camera3D, DirectionalLight, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";

import { Floor, fog } from "./components/Floor";

const cube = new CubeGeometry({ depth: 0.6, height: 0.6, width: 0.6 });
const materials = [0x4f9ed9, 0xe8a33d, 0x6cc070].map(baseColor => new Material3D({ baseColor, roughness: 0.7 }));
const matrix = new Matrix4();
const start: [number, number, number] = [0, 3.5, 5.5];
const target: [number, number, number] = [0, 0.5, 0];
const spacing = 1.2;

// Each slot sits on a square grid sized for the whole batch and bobs on its own phase.
function place(i: number, size: number, time: number) {
  const side = Math.ceil(Math.sqrt(size));
  const half = ((side - 1) * spacing) / 2;
  return matrix.makeTranslation(
    (i % side) * spacing - half,
    0.4 + Math.sin(time + i * 0.5) * 0.15,
    Math.floor(i / side) * spacing - half
  );
}

// The ticker and the effects need the application and the node, so they run in a child of the Stage.
function Batch({ count, size }: { count: number; size: number }) {
  const batch = useRef<PixiBatchedMesh3D>(null);
  const time = useRef(0);
  // Fill every slot once. size is constructor-only, so the effect runs again only under a new key.
  useEffect(() => {
    const mesh = batch.current;
    if (!mesh) return;
    for (let i = 0; i < size; i++) {
      mesh.setGeometryAt(i, cube);
      mesh.setMaterialAt(i, materials[i % materials.length]);
      mesh.setPassesAt(i, RenderPassBit.OPAQUE | RenderPassBit.SHADOW);
    }
  }, [size]);
  // setVisibleAt rebuilds nothing, so it is the way to spawn and despawn.
  useEffect(() => {
    for (let i = 0; i < size; i++) batch.current?.setVisibleAt(i, i < count);
  }, [count, size]);
  usePixiTicker(ticker => {
    time.current += 0.03 * ticker.deltaTime;
    for (let i = 0; i < size; i++) batch.current?.setMatrixAt(i, place(i, size, time.current));
  });
  return <BatchedMesh3D ref={batch} size={size} />;
}

export default function BatchedMesh3DExample() {
  const { count, size } = useControls({
    count: { max: 100, min: 0, step: 1, value: 25 },
    size: { options: [25, 50, 100], value: 50 },
  });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={25} maxPolarAngle={1.45} minDistance={4} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        {/* size is constructor-only: a new key builds a new batch. */}
        {/* count is clamped, as a slot past the size does not exist. */}
        <Batch key={size} count={Math.min(count, size)} size={size} />
        <Floor />
      </View3D>
    </Stage>
  );
}
