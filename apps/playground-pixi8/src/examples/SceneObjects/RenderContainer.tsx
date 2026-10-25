import { RenderContainer } from "@react-pixi-fiber/pixi-8";
import type { Renderer } from "pixi.js";
import { Stage, Text } from "react-pixi-fiber";

const clearToPurple = (renderer: Renderer) => renderer.clear({ clearColor: "purple" });

export default function RenderContainerExample() {
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <RenderContainer render={clearToPurple} />
      <Text style={{ fill: "white", fontSize: 28 }} text="Cleared by RenderContainer" x={40} y={130} />
    </Stage>
  );
}
