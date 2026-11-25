import { CubeGeometry, Material3D, type Pointer3DEvent } from "@pixi/3d";
import { Camera3D, DirectionalLight, Mesh3D, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useState } from "react";
import { Stage, Text } from "react-pixi-fiber";

const cube = new CubeGeometry();
const blue = new Material3D({ baseColor: 0x4f9ed9 });
const orange = new Material3D({ baseColor: 0xd96c4f });

export default function EventsExample() {
  const [selected, setSelected] = useState(false);
  const [presses, setPresses] = useState(0);
  const [y, setY] = useState(0);

  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize>
        <Camera3D position={[0, 1.5, 5]} rotation={[-0.3, 0, 0]} />
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
