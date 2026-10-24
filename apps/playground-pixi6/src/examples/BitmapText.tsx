import { BitmapFont } from "pixi.js";
import { useState } from "react";
import { BitmapText, Stage } from "react-pixi-fiber";

BitmapFont.from("Example", { fill: "white", fontFamily: "Arial", fontSize: 32 });

export default function BitmapTextExample() {
  const [text, setText] = useState("Hello PixiJS 6");
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <BitmapText interactive fontName="Example" click={() => setText("Clicked")} text={text} x={20} y={130} />
    </Stage>
  );
}
