import {
  CapsuleGeometry,
  ConeGeometry,
  CubeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  Material3D,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry,
} from "@pixi/3d";
import { Camera3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { Stage } from "react-pixi-fiber";
import { Floor, fog } from "./components/Floor";

const geometries = [
  new CapsuleGeometry(),
  new ConeGeometry(),
  new CubeGeometry(),
  new CylinderGeometry(),
  new IcosahedronGeometry(),
  new PlaneGeometry(),
  new SphereGeometry(),
  new TorusGeometry(),
  new TorusKnotGeometry(),
];
const matte = new Material3D({ baseColor: 0x4f9ed9, roughness: 0.9 });
const metal = new Material3D({ baseColor: 0xffc356, metallic: 1, roughness: 0.25 });
const start: [number, number, number] = [0, 7, 10];
const target: [number, number, number] = [0, 0.5, 0];

export default function Mesh3DExample() {
  const { material } = useControls({ material: { options: ["matte", "metal"], value: "matte" } });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {/* A metallic material reflects the environment, so the view needs one or the metal draws dark. */}
      <View3D autoResize fog={fog} environment={{ groundColor: 0x3a3028, skyColor: 0xbfd4ff }}>
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={25} maxPolarAngle={1.45} minDistance={5} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        {/* The material is a plain prop: a new material keeps the mesh. */}
        {/* The torus knot is the widest shape (3.8 units), so the grid step is 4. */}
        {/* The y lifts the bottom of each shape to the floor. */}
        {geometries.map((geometry, i) => (
          <Mesh3D
            key={i}
            geometry={geometry}
            material={material === "metal" ? metal : matte}
            position={[(i % 3) * 4 - 4, -geometry.bounds3D.min.y, Math.floor(i / 3) * 4 - 4]}
          />
        ))}
        <Floor />
      </View3D>
    </Stage>
  );
}
