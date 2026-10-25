import { GraphicsContext } from "pixi.js";
import { useMemo } from "react";
import { Graphics, Stage } from "react-pixi-fiber";

export default function GraphicsExample() {
  const context = useMemo(
    () => new GraphicsContext().rect(0, 0, 120, 80).fill(0xff3300).circle(60, 40, 20).fill(0xffff00),
    []
  );
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <Graphics context={context} x={140} y={110} />
    </Stage>
  );
}
