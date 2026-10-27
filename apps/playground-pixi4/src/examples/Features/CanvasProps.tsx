import { Point } from "pixi.js";
import { type ComponentProps, type ComponentType } from "react";
import { Sprite, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

const centerAnchor = new Point(0.5, 0.5);

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

type BunnyProps = Omit<ComponentProps<typeof Sprite>, "texture"> & {
  // Component used to render the bunny, e.g. `Animated.Sprite`
  as?: ComponentType<any>;
  // Index of the bunny in the sprite sheet
  texture?: number;
};

function Bunny({ as: Component = Sprite, texture = 0, ...passedProps }: BunnyProps) {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const frame = textures[bunnyNames[texture]];
  return frame ? <Component anchor={centerAnchor} {...passedProps} texture={frame} /> : null;
}

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

function CanvasPropsExample() {
  return (
    <>
      <style>{".bordered { border: 5px solid #222; }"}</style>
      <Stage className="bordered" options={OPTIONS} style={{ borderRadius: 16 }}>
        <Bunny x={200} y={150} />
      </Stage>
    </>
  );
}

export default CanvasPropsExample;
