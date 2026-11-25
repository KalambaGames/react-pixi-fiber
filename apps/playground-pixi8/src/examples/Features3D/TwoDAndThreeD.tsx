import { Material3D, TorusKnotGeometry } from "@pixi/3d";
import { Camera3D, DirectionalLight, Mesh3D, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useState } from "react";
import { Stage, Text, usePixiTicker } from "react-pixi-fiber";

const geometry = new TorusKnotGeometry();
const material = new Material3D();

// usePixiTicker reads the application, so it runs in a child of the Stage.
function Scene({ direction }: { direction: 1 | -1 }) {
  const [turn, setTurn] = useState(0);
  usePixiTicker(ticker => setTurn(angle => angle + direction * 0.02 * ticker.deltaTime));
  return (
    <>
      <Camera3D position={[0, 0, 5]} />
      <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
      {/* A node has one parent, so each view gets its own mesh. */}
      {/* The two meshes share one geometry and one material. */}
      <Mesh3D geometry={geometry} material={material} rotation={[0, turn, 0]} />
    </>
  );
}

export default function TwoDAndThreeDExample() {
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      {/* A View3D is a 2D object with 2D siblings and draws in JSX order. Each view has its own scene and camera. */}
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 24 }} text="Under the views" x={40} y={140} />
      <View3D height={180} width={180} x={10} y={60}>
        <Scene direction={1} />
      </View3D>
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 24 }} text="Between the views" x={120} y={160} />
      <View3D height={180} width={180} x={210} y={60}>
        <Scene direction={-1} />
      </View3D>
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 24 }} text="Over the views" x={250} y={140} />
    </Stage>
  );
}
