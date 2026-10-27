// Every filter and every parameter: https://pixijs.io/filters/examples/
import { useControls } from "leva";
import {
  OutlineFilter as PixiOutlineFilter,
  type OutlineFilterOptions,
  PixelateFilter as PixiPixelateFilter,
} from "pixi-filters";
import { Assets, Point, Spritesheet, type Texture, TextureSource } from "pixi.js";
import { useEffect, useState } from "react";
import { BlurFilter, PIXIFilter, Sprite, Stage, Text } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

TextureSource.defaultOptions.scaleMode = "nearest";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

const OutlineFilter = PIXIFilter("OutlineFilter", (props: OutlineFilterOptions) => new PixiOutlineFilter(props));
const PixelateFilter = PIXIFilter("PixelateFilter", (props: { size?: number }) => new PixiPixelateFilter(props.size));

const centerAnchor = new Point(0.5, 0.5);
const scale = new Point(4, 4);

export default function StackExample() {
  const [texture, setTexture] = useState<Texture>();

  // PixiJS 8 loads the sprite sheet asynchronously, so the bunny renders once its texture exists.
  useEffect(() => {
    let cancelled = false;
    bunnySheet.then(sheet => {
      if (cancelled) return;
      setTexture(sheet.textures.bunny);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text="The filter children apply in JSX order"
        x={10}
        y={8}
      />
      {texture && (
        <Sprite anchor={centerAnchor} scale={scale} texture={texture} x={200} y={160}>
          {order === "outline first" ? [outlined, pixelated] : [pixelated, outlined]}
          {blur && <BlurFilter strength={2} />}
        </Sprite>
      )}
    </Stage>
  );
}
