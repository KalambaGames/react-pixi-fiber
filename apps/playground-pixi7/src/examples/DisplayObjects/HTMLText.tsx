import { HTMLText } from "@react-pixi-fiber/pixi-7";
import { HTMLTextStyle } from "pixi.js";
import { Stage } from "react-pixi-fiber";

const style = new HTMLTextStyle({ fill: "white", fontSize: 28 });

export default function HTMLTextExample() {
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <HTMLText style={style} text="<b>Bold</b>, <i>italic</i> and <u>underlined</u>" x={20} y={130} />
    </Stage>
  );
}
