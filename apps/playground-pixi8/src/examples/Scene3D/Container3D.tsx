import { Material3D, SphereGeometry } from "@pixi/3d";
import { Camera3D, Container3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { useState } from "react";
import { Stage, usePixiTicker } from "react-pixi-fiber";
import { Floor, fog } from "./components/Floor";

const sphere = new SphereGeometry();
const sun = new Material3D({ baseColor: 0xffc356 });
const planetMaterial = new Material3D({ baseColor: 0x4f9ed9 });
const moonMaterial = new Material3D({ baseColor: 0xdddddd });
const start: [number, number, number] = [0, 3, 8];
const target: [number, number, number] = [0, 0, 0];

// usePixiTicker reads the application, so it runs in a child of the Stage.
function System({ moon, planet }: { moon: boolean; planet: boolean }) {
  const [turn, setTurn] = useState(0);
  usePixiTicker(ticker => setTurn(turn => turn + 0.01 * ticker.deltaTime));
  return (
    // The sun turns, and its children with it.
    <Container3D rotation={[0, turn, 0]}>
      <Mesh3D geometry={sphere} material={sun} />
      {/* visible hides a node and all its children. */}
      <Container3D position={[3, 0, 0]} rotation={[0, turn * 2, 0]} visible={planet}>
        <Mesh3D geometry={sphere} material={planetMaterial} scale={0.5} />
        <Mesh3D geometry={sphere} material={moonMaterial} position={[1, 0, 0]} scale={0.2} visible={moon} />
      </Container3D>
    </Container3D>
  );
}

export default function Container3DExample() {
  const { moon, planet } = useControls({ moon: true, planet: true });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={20} maxPolarAngle={1.45} minDistance={4} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <System moon={moon} planet={planet} />
        {/* The floor is two units below the sun, so the system floats above it. */}
        <Floor y={-2} />
      </View3D>
    </Stage>
  );
}
