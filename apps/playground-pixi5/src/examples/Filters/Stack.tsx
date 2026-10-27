// Every filter and every parameter: https://pixijs.io/filters/examples/
import { useControls } from "leva";
import { OutlineFilter as PixiOutlineFilter, PixelateFilter as PixiPixelateFilter } from "pixi-filters";
import { BaseTexture, Point, SCALE_MODES, settings, Spritesheet } from "pixi.js";
import { BlurFilter, PIXIFilter, Sprite, Stage, Text } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const OutlineFilter = PIXIFilter(
  "OutlineFilter",
  (props: { color?: number; thickness?: number }) => new PixiOutlineFilter(props.thickness, props.color)
);
const PixelateFilter = PIXIFilter("PixelateFilter", (props: { size?: number }) => new PixiPixelateFilter(props.size));

const centerAnchor = new Point(0.5, 0.5);
const scale = new Point(4, 4);
const sheet = new Spritesheet(BaseTexture.from(bunnys), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse(() => {});
const texture = sheet.textures.bunny;

export default function StackExample() {
  const { blur, order, outline, pixelate } = useControls({
    pixelate: true,
    outline: true,
    blur: false,
    order: { options: ["pixelate first", "outline first"] },
  });

  // A toggle mounts or unmounts a filter element. The keys let React move the outline and pixelate filters when
  // the order changes, instead of creating new ones.
  const outlined = outline && <OutlineFilter color={0xffff00} key="outline" thickness={4} />;
  const pixelated = pixelate && <PixelateFilter key="pixelate" size={6} />;

  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text="The filter children apply in JSX order"
        x={10}
        y={8}
      />
      <Sprite anchor={centerAnchor} scale={scale} texture={texture} x={200} y={160}>
        {order === "outline first" ? [outlined, pixelated] : [pixelated, outlined]}
        {blur && <BlurFilter blur={2} />}
      </Sprite>
    </Stage>
  );
}
