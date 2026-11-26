import { CubeGeometry, Material3D, SphereGeometry, TorusKnotGeometry } from "@pixi/3d";
import { useControls } from "leva";

import { Stage } from "react-pixi-fiber";
import { Camera3D, Container3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";

import { Floor, fog } from "./components/Floor";

const cube = new CubeGeometry();
const sphere = new SphereGeometry();
const knot = new TorusKnotGeometry();
const red = new Material3D({ baseColor: 0xd9534f, roughness: 0.7 });
const green = new Material3D({ baseColor: 0x5cb85c, roughness: 0.7 });
const white = new Material3D({ baseColor: 0xffffff, roughness: 0.7 });
const front: [number, number, number] = [0, 5, 10];
const side: [number, number, number] = [10, 5, 0];
const group: [number, number, number] = [-7, 9, 7];
const target: [number, number, number] = [0, 1, 0];
const cubeAt: [number, number, number] = [-2.5, 0.5, 0];
const sphereAt: [number, number, number] = [0, 0.5, 2.5];
const knotAt: [number, number, number] = [2.5, 1.9, -2];

export default function CameraSwitchExample() {
  const { camera } = useControls({ camera: { options: ["front", "side", "group"], value: "front" } });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        {/* The view draws from the active camera, at any depth. */}
        <Camera3D active={camera === "front"} position={front} />
        <Camera3D active={camera === "side"} position={side} />
        {/* The group has no transform, so the position the controller writes stays a world position. */}
        <Container3D>
          <Camera3D active={camera === "group"} position={group} />
        </Container3D>
        {/* One controller follows whichever camera draws. */}
        <OrbitCamera enableDamping maxDistance={25} maxPolarAngle={1.45} minDistance={4} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Mesh3D geometry={cube} material={red} position={cubeAt} />
        <Mesh3D geometry={sphere} material={green} position={sphereAt} />
        <Mesh3D geometry={knot} material={white} position={knotAt} scale={0.5} />
        <Floor />
      </View3D>
    </Stage>
  );
}
