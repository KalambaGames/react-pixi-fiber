import { Point, Rectangle, SCALE_MODES, settings, Texture } from "pixi.js";
import { type ComponentProps, type ComponentType } from "react";
import { Sprite, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

const centerAnchor = new Point(0.5, 0.5);

const bunnyTextures = Texture.from(bunnys);
const textures = [
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 47, 26, 37)),
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 86, 26, 37)),
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 125, 26, 37)),
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 164, 26, 37)),
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 2, 26, 43)),
];

type BunnyProps = Omit<ComponentProps<typeof Sprite>, "texture"> & {
  // Component used to render the bunny, e.g. `Animated.Sprite`
  as?: ComponentType<any>;
  // Index of the bunny in the sprite sheet
  texture?: number;
};

function Bunny({ as: Component = Sprite, texture = 0, ...passedProps }: BunnyProps) {
  return <Component anchor={centerAnchor} {...passedProps} texture={textures[texture]} />;
}

// Scale mode for all textures, will retain pixelation
settings.SCALE_MODE = SCALE_MODES.NEAREST;

const WIDTH = 400;
const HEIGHT = 300;
const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: HEIGHT,
  width: WIDTH,
};

function PointsExample() {
  return (
    <Stage options={OPTIONS}>
      {/* Position via single value of X as string */}
      <Bunny position="35" />
      {/* Position via single value of X as number */}
      <Bunny position={70} />
      {/* Position via single value of X in array */}
      <Bunny position={[105]} />
      {/* Position via list of X and Y as comma delimited string */}
      <Bunny position="140,140" />
      {/* Position via single value of X as string */}
      <Bunny position={[175, 175]} />
      {/* Position via list of X and Y in array */}
      <Bunny position={{ x: 210, y: 210 }} />
      {/* Position via explicit PIXI.Point */}
      <Bunny position={new Point(245, 245)} />
    </Stage>
  );
}

export default PointsExample;
