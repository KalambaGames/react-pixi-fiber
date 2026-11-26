import {
  CubeGeometry,
  Material3D,
  type Mesh3D as PixiMesh3D,
  SphereGeometry,
  type View3D as PixiView3D,
  Vector3,
} from "@pixi/3d";
import { Camera3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";
import { Point, type Text as PixiText } from "pixi.js";
import { useRef } from "react";
import { Stage, Text, usePixiTicker } from "react-pixi-fiber";
import { Floor, fog } from "./components/Floor";

const cube = new CubeGeometry();
const sphere = new SphereGeometry();
const blue = new Material3D({ baseColor: 0x4f9ed9, roughness: 0.7 });
const orange = new Material3D({ baseColor: 0xe8a33d, roughness: 0.7 });
const start: [number, number, number] = [0, 3, 8];
const target: [number, number, number] = [0, 0.5, 0];
const cubeAt: [number, number, number] = [-2, 0.5, 0];
const sphereAt: [number, number, number] = [2, 0.5, 0];
const centerAnchor = new Point(0.5, 1);
const style = { fill: "white", fontFamily: "Arial", fontSize: 16, fontWeight: "bold" } as const;
const world = new Vector3();
const screen = new Point();

// The ticker needs the application, so it runs in a child of the Stage.
function Scene() {
  const view = useRef<PixiView3D>(null);
  const meshes = useRef<(PixiMesh3D | null)[]>([]);
  const labels = useRef<(PixiText | null)[]>([]);
  // worldToScreen gives null for a point behind the camera. Each label sits 1 unit over its object.
  usePixiTicker(() => {
    labels.current.forEach((label, i) => {
      const mesh = meshes.current[i];
      if (!label || !mesh || !view.current) return;
      mesh.getGlobalPosition(world);
      world.y += 1;
      const point = view.current.worldToScreen(world, screen);
      label.visible = point !== null;
      if (point) label.position.copyFrom(point);
    });
  });
  return (
    <>
      <View3D autoResize fog={fog} ref={view}>
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={20} maxPolarAngle={1.45} minDistance={4} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Mesh3D geometry={cube} material={blue} position={cubeAt} ref={mesh => void (meshes.current[0] = mesh)} />
        <Mesh3D geometry={sphere} material={orange} position={sphereAt} ref={mesh => void (meshes.current[1] = mesh)} />
        <Floor />
      </View3D>
      {/* 2D siblings after the view draw over it. A 2D object cannot be a child of the view. */}
      <Text anchor={centerAnchor} ref={text => void (labels.current[0] = text)} style={style} text="Cube" />
      <Text anchor={centerAnchor} ref={text => void (labels.current[1] = text)} style={style} text="Sphere" />
    </>
  );
}

export default function LabelsExample() {
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <Scene />
    </Stage>
  );
}
