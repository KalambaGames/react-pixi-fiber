// Every filter and every parameter: https://pixijs.io/filters/examples/
import { useControls } from "leva";
import { OutlineFilter as PixiOutlineFilter, PixelateFilter as PixiPixelateFilter } from "pixi-filters";
import { BaseTexture, Point, Rectangle, SCALE_MODES, Texture } from "pixi.js";
import { BlurFilter, PIXIFilter, Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

const OutlineFilter = PIXIFilter(
  "OutlineFilter",
  (props: { color?: number; thickness?: number }) => new PixiOutlineFilter(props.thickness, props.color)
);
const PixelateFilter = PIXIFilter("PixelateFilter", (props: { size?: number }) => new PixiPixelateFilter(props.size));

const centerAnchor = new Point(0.5, 0.5);
const scale = new Point(4, 4);
const texture = new Texture(Texture.from(bunnys).baseTexture, new Rectangle(2, 47, 26, 37));

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
