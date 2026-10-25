import { extras, Texture } from "pixi.js";
import { useState } from "react";
import { BitmapText, Stage } from "react-pixi-fiber";

// PixiJS 4 has no BitmapFont.from, so the glyphs are drawn on a canvas and registered as a font.
function registerFont(name: string, size: number) {
  const chars = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = `${size}px Arial`;
  const widths = chars.map(char => Math.ceil(context.measureText(char).width));
  const lineHeight = Math.ceil(size * 1.25);
  canvas.width = widths.reduce((sum, width) => sum + width + 2, 0);
  canvas.height = lineHeight;
  // A canvas resize resets the context.
  context.font = `${size}px Arial`;
  context.fillStyle = "white";
  context.textBaseline = "top";
  let x = 0;
  const tags = chars.map((char, i) => {
    context.fillText(char, x, 0);
    const tag = `<char id="${char.charCodeAt(0)}" x="${x}" y="0" width="${widths[i]}" height="${lineHeight}" xoffset="0" yoffset="0" xadvance="${widths[i]}" page="0"/>`;
    x += widths[i] + 2;
    return tag;
  });
  const xml = `<font><info face="${name}" size="${size}"/><common lineHeight="${lineHeight}"/><pages><page id="0" file=""/></pages><chars>${tags.join("")}</chars></font>`;
  extras.BitmapText.registerFont(new DOMParser().parseFromString(xml, "text/xml"), [Texture.fromCanvas(canvas)]);
}

registerFont("Example", 32);

export default function BitmapTextExample() {
  const [text, setText] = useState("Hello PixiJS 4");
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <BitmapText interactive click={() => setText("Clicked")} font="32px Example" text={text} x={20} y={130} />
    </Stage>
  );
}
