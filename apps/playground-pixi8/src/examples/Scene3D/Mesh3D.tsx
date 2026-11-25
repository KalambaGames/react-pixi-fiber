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
import { Camera3D, DirectionalLight, Mesh3D, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { Stage } from "react-pixi-fiber";

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

export default function Mesh3DExample() {
  const { material } = useControls({ material: { options: ["matte", "metal"], value: "matte" } });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {/* A metallic material reflects the environment, so the view needs one or the metal draws dark. */}
      <View3D autoResize environment={{ groundColor: 0x3a3028, skyColor: 0xbfd4ff }}>
        <Camera3D position={[0, 0, 9]} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        {/* The material is a plain prop: changing it keeps the mesh. A plane faces +z, so the rotation shows it at an angle. */}
        {geometries.map((geometry, i) => (
          <Mesh3D
            key={i}
            geometry={geometry}
            material={material === "metal" ? metal : matte}
            position={[(i % 3) * 2.5 - 2.5, 2.5 - Math.floor(i / 3) * 2.5, 0]}
            rotation={[0.5, 0.5, 0]}
          />
        ))}
      </View3D>
    </Stage>
  );
}
