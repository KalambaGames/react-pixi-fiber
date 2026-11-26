import { type CameraMode, CubeGeometry, Material3D } from "@pixi/3d";
import { Camera3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { Stage } from "react-pixi-fiber";
import { Floor, fog } from "./components/Floor";

const cube = new CubeGeometry();
const material = new Material3D({ baseColor: 0x4f9ed9, roughness: 0.9 });
// The core compares props by identity: an inline array would be written again on each change and undo the orbit.
const start: [number, number, number] = [4, 3, 4];
// An orthographic camera sees the floor near its own plane, so it stays 12 times farther away on the same line.
// At the lowest orbit angle and orthographicSize 20 the bottom of the view still meets the floor.
const orthographicStart: [number, number, number] = [48, 30.5, 103];
const target: [number, number, number] = [0, 0.5, -5];

export default function Camera3DExample() {
  // mode comes first in the panel: it decides whether fov or orthographicSize applies.
  const { fov, mode, orthographicSize } = useControls({
    mode: { options: ["perspective", "orthographic"], value: "perspective" },
    fov: { max: 120, min: 20, value: 60 },
    orthographicSize: { max: 20, min: 2, value: 8 },
  });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {/* The fog is for perspective only: the orthographic camera is far away, so all its floor would be fog. */}
      <View3D autoResize fog={mode === "perspective" ? fog : undefined}>
        {/* A direct <Camera3D> child is the camera of the view. The controller aims it, so it has no rotation. */}
        <Camera3D
          fov={fov}
          mode={mode as CameraMode}
          orthographicSize={orthographicSize}
          position={mode === "perspective" ? start : orthographicStart}
        />
        {/* A new controller starts from the new camera position. minZoom stops the orthographic wheel at zoom 1. */}
        <OrbitCamera
          key={mode}
          enableDamping
          maxDistance={mode === "perspective" ? 20 : 130}
          maxPolarAngle={1.45}
          minDistance={4}
          minZoom={1}
          target={target}
        />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        {/* The row runs away from the camera, so the depth shows the projection. */}
        {[0, 1, 2, 3, 4].map(i => (
          <Mesh3D key={i} geometry={cube} material={material} position={[0, 0.5, -i * 2.5]} />
        ))}
        <Floor />
      </View3D>
    </Stage>
  );
}
