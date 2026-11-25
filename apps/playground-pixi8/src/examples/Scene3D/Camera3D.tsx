import { type CameraMode, CubeGeometry, Material3D } from "@pixi/3d";
import { Camera3D, DirectionalLight, Mesh3D, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { Stage } from "react-pixi-fiber";

const cube = new CubeGeometry();
const material = new Material3D({ baseColor: 0x4f9ed9, roughness: 0.9 });

export default function Camera3DExample() {
  const { fov, mode, orthographicSize } = useControls({
    fov: { max: 120, min: 20, value: 60 },
    mode: { options: ["perspective", "orthographic"], value: "perspective" },
    orthographicSize: { max: 20, min: 2, value: 8 },
  });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize>
        {/* A direct <Camera3D> child is the camera of the view. */}
        <Camera3D
          fov={fov}
          mode={mode as CameraMode}
          orthographicSize={orthographicSize}
          position={[4, 3, 6]}
          rotation={[-0.35, 0.55, 0]}
        />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        {/* The row runs away from the camera, so the depth shows the projection. */}
        {[0, 1, 2, 3, 4].map(i => (
          <Mesh3D key={i} geometry={cube} material={material} position={[0, 0, -i * 2.5]} />
        ))}
      </View3D>
    </Stage>
  );
}
