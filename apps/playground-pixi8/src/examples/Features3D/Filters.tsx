import { CubeGeometry, Material3D, SphereGeometry } from "@pixi/3d";
import { useControls } from "leva";
import {
  type AdjustmentFilterOptions,
  AdjustmentFilter as PixiAdjustmentFilter,
  PixelateFilter as PixiPixelateFilter,
} from "pixi-filters";

import { PIXIFilter, Stage } from "react-pixi-fiber";
import { Camera3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";

import { Floor, fog } from "./components/Floor";

const AdjustmentFilter = PIXIFilter(
  "AdjustmentFilter",
  (props: AdjustmentFilterOptions) => new PixiAdjustmentFilter(props)
);
const PixelateFilter = PIXIFilter("PixelateFilter", (props: { size?: number }) => new PixiPixelateFilter(props.size));

const cube = new CubeGeometry();
const sphere = new SphereGeometry();
const blue = new Material3D({ baseColor: 0x4f9ed9, roughness: 0.7 });
const orange = new Material3D({ baseColor: 0xe8a33d, roughness: 0.7 });
const start: [number, number, number] = [0, 3, 8];
const target: [number, number, number] = [0, 0.5, 0];
const cubeAt: [number, number, number] = [-2, 0.5, 0];
const sphereAt: [number, number, number] = [2, 0.5, 0];

export default function FiltersExample() {
  const { adjustment, pixelate } = useControls({ adjustment: true, pixelate: false });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        {/* A filter in a 3D node throws. Put it in the <View3D> element. */}
        {adjustment && <AdjustmentFilter contrast={1.4} saturation={1.6} />}
        {pixelate && <PixelateFilter size={6} />}
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={20} maxPolarAngle={1.45} minDistance={4} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Mesh3D geometry={cube} material={blue} position={cubeAt} />
        <Mesh3D geometry={sphere} material={orange} position={sphereAt} />
        <Floor />
      </View3D>
    </Stage>
  );
}
