import { CubeGeometry, Material3D, type Pointer3DEvent } from "@pixi/3d";
import { useState } from "react";

import { Stage, Text } from "react-pixi-fiber";
import { Camera3D, DirectionalLight, Mesh3D, OrbitCamera, View3D } from "@react-pixi-fiber/pixi3d-0";

import { Floor, fog } from "./components/Floor";

const cube = new CubeGeometry();
const blue = new Material3D({ baseColor: 0x4f9ed9 });
const orange = new Material3D({ baseColor: 0xd96c4f });
// A click re-renders the view, so the camera position is a constant: an inline array would undo the orbit.
const start: [number, number, number] = [1, 2, 5];
const target: [number, number, number] = [1, 0, 0];

export default function EventsExample() {
  const [selected, setSelected] = useState(false);
  const [presses, setPresses] = useState(0);
  const [y, setY] = useState(0);

  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        <Camera3D position={start} />
        {/* A drag orbits the camera. A click without a drag still reaches the cube. */}
        <OrbitCamera enableDamping maxDistance={12} maxPolarAngle={1.45} minDistance={3} target={target} />
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        {/* A 3D node is "passive" by default and takes no events. */}
        <Mesh3D
          cursor="pointer"
          eventMode="static"
          geometry={cube}
          material={selected ? orange : blue}
          onclick={() => setSelected(wasSelected => !wasSelected)}
          onpointerdown={(event: Pointer3DEvent) => {
            setPresses(count => count + 1);
            setY(event.hit3D?.point.y ?? 0);
          }}
        />
        {/* No event props, so a click on this cube does nothing. */}
        <Mesh3D geometry={cube} material={blue} position={[2, 0, 0]} />
        <Floor y={-0.5} />
      </View3D>
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 16 }}
        text={`pointerdown: ${presses}, last hit at y ${y.toFixed(2)}`}
        x={10}
        y={10}
      />
    </Stage>
  );
}
