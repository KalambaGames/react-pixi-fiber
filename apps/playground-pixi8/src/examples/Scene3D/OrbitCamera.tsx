import { Material3D, TorusKnotGeometry } from "@pixi/3d";
import { useControls } from "leva";

import { Stage } from "react-pixi-fiber";
import { Camera3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";

import { Floor, fog } from "./components/Floor";

const knot = new TorusKnotGeometry();
const material = new Material3D({ baseColor: 0xe8a33d, roughness: 0.6 });
// The core compares props by identity: an inline array would be written again on each toggle and undo the orbit.
const start: [number, number, number] = [0, 3, 8];
const target: [number, number, number] = [0, 1, 0];

export default function OrbitCameraExample() {
  const { autoRotate, enabled } = useControls({ autoRotate: false, enabled: true });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        {/* A controller is not a camera: it moves the camera that the view draws from, so start it here. */}
        <Camera3D position={start} />
        {/* maxPolarAngle stops the camera just above the floor, so a drag cannot take it under. */}
        <OrbitCamera
          autoRotate={autoRotate}
          enableDamping
          enabled={enabled}
          maxDistance={20}
          maxPolarAngle={1.45}
          minDistance={3}
          target={target}
        />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Mesh3D geometry={knot} material={material} position={[0, 1, 0]} />
        <Floor />
      </View3D>
    </Stage>
  );
}
