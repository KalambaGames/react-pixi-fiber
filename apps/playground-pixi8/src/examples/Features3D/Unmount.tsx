import { CubeGeometry, Material3D } from "@pixi/3d";
import { useControls } from "leva";

import { Stage } from "react-pixi-fiber";
import { Camera3D, Container3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";

import { Floor, fog } from "./components/Floor";

// An unmount destroys the nodes, not the geometry and material they share.
const cube = new CubeGeometry();
const material = new Material3D({ baseColor: 0x4f9ed9, roughness: 0.7 });
const start: [number, number, number] = [0, 2.5, 6];
const target: [number, number, number] = [0, 0.5, 0];
const centerAt: [number, number, number] = [0, 0.5, 0];
const leftAt: [number, number, number] = [-2.5, 0.5, 0];
const rightAt: [number, number, number] = [2.5, 0.5, 0];
const backAt: [number, number, number] = [0, 0.5, -2.5];

export default function UnmountExample() {
  const { mounted } = useControls({ mounted: true });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={20} maxPolarAngle={1.45} minDistance={4} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Mesh3D geometry={cube} material={material} position={centerAt} />
        {mounted && (
          <Container3D>
            <Mesh3D geometry={cube} material={material} position={leftAt} />
            <Mesh3D geometry={cube} material={material} position={rightAt} />
            <Mesh3D geometry={cube} material={material} position={backAt} />
          </Container3D>
        )}
        <Floor />
      </View3D>
    </Stage>
  );
}
