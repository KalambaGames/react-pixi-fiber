import { DOMContainer } from "@react-pixi-fiber/pixi-8";
import { useMemo } from "react";
import { Stage } from "react-pixi-fiber";

export default function DOMContainerExample() {
  const element = useMemo(() => {
    const button = document.createElement("button");
    button.textContent = "A DOM button";
    button.onclick = () => console.log("Clicked");
    return button;
  }, []);
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <DOMContainer anchor={0.5} element={element} x={200} y={150} />
    </Stage>
  );
}
