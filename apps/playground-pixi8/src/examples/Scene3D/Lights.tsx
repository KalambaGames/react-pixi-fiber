import { CubeGeometry, Material3D, SphereGeometry, TorusKnotGeometry } from "@pixi/3d";
import {
  AmbientLight,
  Camera3D,
  DirectionalLight,
  Mesh3D,
  OrbitCamera,
  PointLight,
  SpotLight,
  View3D,
} from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { Stage } from "react-pixi-fiber";
import { Floor, fog } from "./components/Floor";

const cube = new CubeGeometry();
const sphere = new SphereGeometry();
const knot = new TorusKnotGeometry();
const matte = new Material3D({ baseColor: 0xe8e8e8, roughness: 0.8 });
const start: [number, number, number] = [0, 6, 9];
const target: [number, number, number] = [0, 0.5, 0];
// The sun and the spot point down their local -z axis. The spot sits right of the shapes and leans toward them.
const sunAngle: [number, number, number] = [-0.8, 0.4, 0];
const spotAngle: [number, number, number] = [-1.1, 0, 0];
const pointAt: [number, number, number] = [-3, 1.5, 2];
const spotAt: [number, number, number] = [3, 5, 3];
const cubeAt: [number, number, number] = [-1.5, 0.5, 0];
const sphereAt: [number, number, number] = [1.5, 0.5, 0.5];
const knotAt: [number, number, number] = [0, 1.9, -2];

export default function LightsExample() {
  const { ambient, castShadow, directional, point, spot } = useControls({
    ambient: true,
    castShadow: true,
    directional: true,
    point: true,
    spot: true,
  });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {/* shadowQuality is the size of the shadow maps. It belongs to the view, not to a light. */}
      <View3D autoResize fog={fog} shadowQuality="high">
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={25} maxPolarAngle={1.45} minDistance={4} target={target} />
        {/* Only a directional light and a spot light cast shadows. */}
        {/* A point light and an ambient light ignore castShadow. */}
        <AmbientLight intensity={0.3} visible={ambient} />
        <DirectionalLight castShadow={castShadow} intensity={1.5} rotation={sunAngle} visible={directional} />
        <PointLight color={0xff8040} intensity={30} position={pointAt} range={9} visible={point} />
        <SpotLight
          castShadow={castShadow}
          coneAngle={25}
          intensity={120}
          penumbra={0.3}
          position={spotAt}
          range={14}
          rotation={spotAngle}
          visible={spot}
        />
        {/* The meshes cast and receive. Floor takes no shadow props: it receives by default and casts none. */}
        <Mesh3D castShadow geometry={cube} material={matte} position={cubeAt} receiveShadow />
        <Mesh3D castShadow geometry={sphere} material={matte} position={sphereAt} receiveShadow />
        <Mesh3D castShadow geometry={knot} material={matte} position={knotAt} receiveShadow scale={0.6} />
        <Floor />
      </View3D>
    </Stage>
  );
}
