// Every filter and every parameter: https://pixijs.io/filters/examples/
import { GlowFilter as PixiGlowFilter, type GlowFilterOptions } from "pixi-filters";
import { BaseTexture, Point, Rectangle, SCALE_MODES, Texture } from "pixi.js";
import { PIXIFilter, Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

const GlowFilter = PIXIFilter("GlowFilter", (props: Partial<GlowFilterOptions>) => new PixiGlowFilter(props));

const centerAnchor = new Point(0.5, 0.5);
const scale = new Point(3, 3);
const texture = new Texture(Texture.from(bunnys).baseTexture, new Rectangle(2, 47, 26, 37));

export default function BasicExample() {
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text="One filter as a child element"
        x={10}
        y={8}
      />
      <Sprite anchor={centerAnchor} scale={scale} texture={texture} x={200} y={160}>
        <GlowFilter color={0xffff00} distance={15} outerStrength={4} />
      </Sprite>
    </Stage>
  );
}
