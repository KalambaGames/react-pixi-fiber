import { Material3D, TorusKnotGeometry } from "@pixi/3d";
import { useState } from "react";

import { Stage, Text, usePixiTicker } from "react-pixi-fiber";
import { Camera3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";

const geometry = new TorusKnotGeometry();
const material = new Material3D();
// Scene renders on each tick, so the camera position is a constant: an inline array would undo the orbit.
const start: [number, number, number] = [0, 1.5, 5];
const target: [number, number, number] = [0, 0, 0];

// usePixiTicker reads the application, so it runs in a child of the Stage.
function Scene({ direction }: { direction: 1 | -1 }) {
  const [turn, setTurn] = useState(0);
  usePixiTicker(ticker => setTurn(angle => angle + direction * 0.02 * ticker.deltaTime));
  return (
    <>
      <Camera3D position={start} />
      {/* Each view has its own controller, which moves the camera of that view. */}
      <OrbitCamera enableDamping maxDistance={12} maxPolarAngle={1.45} minDistance={3} target={target} />
      <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
      {/* A node has one parent, so each view gets its own mesh. */}
      {/* The two meshes share one geometry and one material. */}
      <Mesh3D geometry={geometry} material={material} rotation={[0, turn, 0]} />
      {/* The view has no floor, so the 2D text behind it shows through. */}
    </>
  );
}

export default function TwoDAndThreeDExample() {
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {/* A View3D is a 2D object with 2D siblings and draws in JSX order. Each view has its own scene and camera. */}
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 18 }} text="Under the views" x={20} y={125} />
      <View3D height={180} width={180} x={10} y={60}>
        <Scene direction={1} />
      </View3D>
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 18 }} text="Between the views" x={125} y={140} />
      <View3D height={180} width={180} x={210} y={60}>
        <Scene direction={-1} />
      </View3D>
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 18 }} text="Over the views" x={250} y={125} />
    </Stage>
  );
}
