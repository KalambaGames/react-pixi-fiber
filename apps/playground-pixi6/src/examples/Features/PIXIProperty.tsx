import { Point, Rectangle, Texture } from "pixi.js";
import React, { type ComponentProps, type ComponentType, useCallback, useState } from "react";
import {
  Container,
  PIXIProperty,
  type PixiAppProperties,
  Sprite,
  Stage,
  usePixiTicker,
  withApp,
} from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

console.log(
  "The invalid `id` warning below is expected: `id` is registered as a number, and two bunnies pass a string."
);

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

type RotatingBunnyProps = PixiAppProperties &
  BunnyProps & {
    step?: number;
  };

// http://pixijs.io/examples/#/basics/basic.js
// we don't want to pass app prop further down, it will trigger dev warning
const RotatingBunnyComponent = withApp(function RotatingBunny({ app, step = 0.1, ...passedProps }: RotatingBunnyProps) {
  const [rotation, setRotation] = useState(0);

  const animate = useCallback(
    (delta: number) => {
      // just for fun, let's rotate mr rabbit a little
      // delta is 1 if running at 100% performance
      // creates frame-independent tranformation
      setRotation(rotation => rotation + step * delta);
    },
    [step]
  );

  usePixiTicker(animate);

  return <Bunny {...passedProps} rotation={rotation} />;
});

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

// Register `id` as a legal prop on `Sprite` in development, validated as number.
PIXIProperty(Sprite, "id", value => typeof value === "number");

// TypeScript cannot know about custom properties registered at runtime, so widen the props type here.
// `bunnyName` is intentionally not registered and `id` is intentionally allowed to be a string to trigger dev warnings.
type CustomProps = {
  bunnyName?: string;
  id?: number | string;
};
const RotatingBunny = RotatingBunnyComponent as React.ComponentType<
  React.ComponentProps<typeof RotatingBunnyComponent> & CustomProps
>;

function CustomPIXIPropertyExample() {
  return (
    <Stage options={OPTIONS}>
      <Container>
        <RotatingBunny bunnyName="Regular" id={1} name="regular" step={0.1} texture={0} x={200} y={150} />
        <RotatingBunny bunnyName="Cool" id={2} name="cool" step={0.2} texture={1} x={100} y={100} />
        <RotatingBunny bunnyName="Sport" id="3" name="sport" step={-0.25} texture={2} x={100} y={200} />
        <React.StrictMode>
          {/* id will be reported in this tree as invalid prop (string instead of number) */}
          <RotatingBunny bunnyName="Cyborg" id="4" name="cyborg" step={-0.1} texture={3} x={300} y={100} />
          {/* bunnyName will be reported in this tree as unknown prop */}
          <RotatingBunny bunnyName="Astronaut" id={5} name="astronaut" step={-0.02} texture={4} x={300} y={200} />
        </React.StrictMode>
      </Container>
    </Stage>
  );
}

export default CustomPIXIPropertyExample;
