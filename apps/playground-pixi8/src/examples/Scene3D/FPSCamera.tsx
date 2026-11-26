import { ConeGeometry, CubeGeometry, Material3D, SphereGeometry } from "@pixi/3d";
import { Camera3D, DirectionalLight, FPSCamera, Mesh3D, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { Stage } from "react-pixi-fiber";
import { Floor, fog } from "./components/Floor";

type Vec3 = [number, number, number];
const cube = new CubeGeometry();
const sphere = new SphereGeometry();
const cone = new ConeGeometry();
const blue = new Material3D({ baseColor: 0x4f9ed9, roughness: 0.9 });
const orange = new Material3D({ baseColor: 0xe8a33d, roughness: 0.6 });
const green = new Material3D({ baseColor: 0x6cc070, roughness: 0.8 });
// Each start looks at the centre: the camera looks along -z at yaw 0, and a positive yaw turns it left.
const starts: Record<string, { position: Vec3; yaw: number }> = {
  back: { position: [0, 1.7, -6], yaw: Math.PI },
  front: { position: [0, 1.7, 6], yaw: 0 },
  left: { position: [-6, 1.7, 0], yaw: -Math.PI / 2 },
  right: { position: [6, 1.7, 0], yaw: Math.PI / 2 },
};
const shapes: { geometry: CubeGeometry | SphereGeometry | ConeGeometry; material: Material3D; position: Vec3 }[] = [
  { geometry: cube, material: blue, position: [-2, 0.5, -1] },
  { geometry: sphere, material: orange, position: [0, 0.5, 0] },
  { geometry: cone, material: green, position: [2, 0.5, -1] },
  { geometry: cube, material: orange, position: [-3, 0.5, 2] },
  { geometry: cone, material: blue, position: [3, 0.5, 2] },
];

export default function FPSCameraExample() {
  const { enabled, start } = useControls({
    enabled: true,
    start: { options: Object.keys(starts), value: "front" },
  });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        {/* Click the stage, then drag to look and press WASD or the arrow keys to walk. */}
        {/* Space goes up and Shift goes down. */}
        {/* The controller starts from the camera of the view, so the start is a position of the camera and a yaw. */}
        <Camera3D position={starts[start].position} />
        <FPSCamera enabled={enabled} yaw={starts[start].yaw} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        {shapes.map((shape, i) => (
          <Mesh3D key={i} {...shape} />
        ))}
        <Floor />
      </View3D>
    </Stage>
  );
}
