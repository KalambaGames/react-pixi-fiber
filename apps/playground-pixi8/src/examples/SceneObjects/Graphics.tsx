import { GraphicsContext, type Graphics as PixiGraphics } from "pixi.js";
import { useMemo } from "react";
import { Graphics, Stage } from "react-pixi-fiber";

// The adapter has no draw prop for PixiJS 8, so the ref callback draws the shapes.
const draw = (graphics: PixiGraphics | null) => {
  graphics?.clear().rect(0, 0, 120, 80).fill(0x33cc66).circle(60, 40, 20).fill(0xffffff);
};

export default function GraphicsExample() {
  // A GraphicsContext can also be passed to the constructor and shared by many Graphics instances.
  const context = useMemo(
    () => new GraphicsContext().rect(0, 0, 120, 80).fill(0xff3300).circle(60, 40, 20).fill(0xffff00),
    []
  );

  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <Graphics ref={draw} x={60} y={110} />
      <Graphics context={context} x={220} y={110} />
    </Stage>
  );
}
