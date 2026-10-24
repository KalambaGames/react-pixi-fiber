import { BaseTexture, Point, Rectangle, SCALE_MODES, Texture } from "pixi.js";
import { type ComponentProps, type ComponentType, useCallback, useState } from "react";
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
BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 600,
  width: 800,
};

// http://pixijs.io/examples/#/basics/click.js
function ClickExample() {
  const [scale, setScale] = useState(1);
  const handleClick = useCallback(() => {
    setScale(scale => scale * 1.25);
  }, []);

  return (
    <Stage options={OPTIONS}>
      <Bunny
        // Shows hand cursor
        cursor="pointer"
        // Opt-in to interactivity
        eventMode="static"
        // Pointers normalize touch and mouse
        onpointerdown={handleClick}
        scale={new Point(scale, scale)}
        x={400}
        y={300}
      />
    </Stage>
  );
}

export default ClickExample;
