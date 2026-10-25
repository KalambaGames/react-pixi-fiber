import { Stage, Text } from "react-pixi-fiber";

export default function TextExample() {
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 32 }} text="Hello PixiJS 7" x={20} y={130} />
    </Stage>
  );
}
