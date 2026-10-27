import { type interaction, Point, SCALE_MODES, settings } from "pixi.js";
import { type ComponentProps, type ComponentType, useCallback, useState } from "react";
import { Sprite, Stage, Text } from "react-pixi-fiber";
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
  const handlePointerDown = useCallback((event: interaction.InteractionEvent) => {
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
