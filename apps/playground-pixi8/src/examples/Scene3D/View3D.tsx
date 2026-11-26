import { CubeGeometry, Material3D } from "@pixi/3d";
import { Camera3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useMemo, useState } from "react";
import { Stage, Text, usePixiTicker } from "react-pixi-fiber";
import { Floor, fog } from "./components/Floor";

const start: [number, number, number] = [0, 1.5, 4];
const target: [number, number, number] = [0, 0, 0];

// usePixiTicker reads the application, so it runs in a child of the Stage.
function Cube() {
  const geometry = useMemo(() => new CubeGeometry(), []);
  const material = useMemo(() => new Material3D(), []);
  const [turn, setTurn] = useState(0);
  usePixiTicker(ticker => setTurn(turn => turn + 0.02 * ticker.deltaTime));
  return <Mesh3D geometry={geometry} material={material} rotation={[0, turn, 0]} />;
}

export default function View3DExample() {
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {/* The view draws over the text above it and under the text below it, in JSX order. */}
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 24 }} text="Below the view" x={20} y={20} />
      <View3D autoResize fog={fog}>
        {/* The controller aims the camera at the target, so the camera has no rotation. Drag to orbit. */}
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={10} maxPolarAngle={1.45} minDistance={2} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Cube />
        <Floor y={-0.5} />
      </View3D>
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 24 }} text="Over the view" x={20} y={260} />
    </Stage>
  );
}
