import { TextStyle } from "pixi.js";
import { useState } from "react";
import { BitmapText, Stage } from "react-pixi-fiber";

const style = new TextStyle({ fill: "white", fontFamily: "Arial", fontSize: 32 });

export default function BitmapTextExample() {
  const [text, setText] = useState("Hello PixiJS 8");
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <BitmapText eventMode="static" onclick={() => setText("Clicked")} style={style} text={text} x={20} y={130} />
    </Stage>
  );
}
