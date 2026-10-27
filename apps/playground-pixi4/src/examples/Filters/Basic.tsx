// Every filter and every parameter: https://pixijs.io/filters/examples/
import { GlowFilter as PixiGlowFilter } from "pixi-filters";
import { Point, SCALE_MODES, settings } from "pixi.js";
import { PIXIFilter, Sprite, Stage, Text } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const GlowFilter = PIXIFilter(
  "GlowFilter",
  (props: { color?: number; distance?: number; innerStrength?: number; outerStrength?: number }) =>
    new PixiGlowFilter(props.distance, props.outerStrength, props.innerStrength, props.color)
);

const centerAnchor = new Point(0.5, 0.5);
const scale = new Point(3, 3);

export default function BasicExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const texture = textures.bunny;

  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text="One filter as a child element"
        x={10}
        y={8}
      />
      {texture && (
        <Sprite anchor={centerAnchor} scale={scale} texture={texture} x={200} y={160}>
          <GlowFilter color={0xffff00} distance={15} outerStrength={4} />
        </Sprite>
      )}
    </Stage>
  );
}
