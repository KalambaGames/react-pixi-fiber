// Every filter and every parameter: https://pixijs.io/filters/examples/
import { GlowFilter as PixiGlowFilter, type GlowFilterOptions } from "pixi-filters";
import { Assets, Point, Rectangle, Texture, TextureSource } from "pixi.js";
import { useEffect, useState } from "react";
import { PIXIFilter, Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

TextureSource.defaultOptions.scaleMode = "nearest";

const GlowFilter = PIXIFilter("GlowFilter", (props: Partial<GlowFilterOptions>) => new PixiGlowFilter(props));

const centerAnchor = new Point(0.5, 0.5);
const scale = new Point(3, 3);

export default function BasicExample() {
  const [texture, setTexture] = useState<Texture>();

  // PixiJS 8 loads the sprite sheet asynchronously, so the bunny renders once its texture exists.
  useEffect(() => {
    let cancelled = false;
    let created: Texture | undefined;
    Assets.load<Texture>(bunnys).then(({ source }) => {
      if (cancelled) return;
      created = new Texture({ frame: new Rectangle(2, 47, 26, 37), source });
      setTexture(created);
    });
    return () => {
      cancelled = true;
      created?.destroy();
    };
  }, []);

  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
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
