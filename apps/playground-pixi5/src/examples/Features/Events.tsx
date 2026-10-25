import { type InteractionEvent, Point, Rectangle, SCALE_MODES, settings, Texture } from "pixi.js";
import { type ComponentProps, type ComponentType, useCallback, useState } from "react";
import { Sprite, Stage, Text } from "react-pixi-fiber";
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

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

// http://pixijs.io/examples/#/basics/click.js
function ClickExample() {
  const [scale, setScale] = useState(1);
  // The right button shrinks the bunny, any other button grows it.
  const handlePointerDown = useCallback((event: InteractionEvent) => {
    const shrink = event.data.button === 2;
    setScale(scale => (shrink ? scale / 1.25 : scale * 1.25));
  }, []);

  return (
    // The canvas keeps the right button for the bunny, without the browser menu.
    <Stage onContextMenu={event => event.preventDefault()} options={OPTIONS}>
      <Bunny
        // Shows hand cursor
        cursor="pointer"
        // Opt-in to interactivity
        interactive
        // Pointers normalize touch and mouse
        pointerdown={handlePointerDown}
        scale={new Point(scale, scale)}
        x={200}
        y={150}
      />
      <Text
        style={{ fill: "white", fontSize: 16 }}
        text="Click the bunny to grow it. Right-click it to shrink it."
        x={10}
        y={10}
      />
    </Stage>
  );
}

export default ClickExample;
