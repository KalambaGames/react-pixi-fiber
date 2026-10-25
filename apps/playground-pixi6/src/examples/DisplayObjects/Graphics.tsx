import type { Graphics as PixiGraphics } from "pixi.js";
import { Graphics, Stage } from "react-pixi-fiber";

// The adapter has no draw prop for PixiJS 6, so the ref callback draws the shapes.
const draw = (graphics: PixiGraphics | null) => {
  graphics?.clear().beginFill(0xff3300).drawRect(0, 0, 120, 80).endFill().beginFill(0xffff00).drawCircle(60, 40, 20);
};

export default function GraphicsExample() {
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Graphics ref={draw} x={140} y={110} />
    </Stage>
  );
}
