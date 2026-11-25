import { Material3D, SphereGeometry } from "@pixi/3d";
import { Camera3D, Container3D, DirectionalLight, Mesh3D, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { useMemo, useState } from "react";
import { Stage, usePixiTicker } from "react-pixi-fiber";

// usePixiTicker reads the application, so it runs in a child of the Stage.
function System() {
  const { moon, planet } = useControls({ moon: true, planet: true });
  const sphere = useMemo(() => new SphereGeometry(), []);
  const sun = useMemo(() => new Material3D({ baseColor: 0xffc356 }), []);
  const planetMaterial = useMemo(() => new Material3D({ baseColor: 0x4f9ed9 }), []);
  const moonMaterial = useMemo(() => new Material3D({ baseColor: 0xdddddd }), []);
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
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize>
        {/* A camera and a light look along their local -z axis, so a negative x rotation tilts them down. */}
        <Camera3D position={[0, 3, 7]} rotation={[-0.4, 0, 0]} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <System />
      </View3D>
    </Stage>
  );
}
