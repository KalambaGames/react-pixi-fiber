import { Point, Rectangle, Texture } from "pixi.js";
import { type ComponentProps, type ComponentType, useCallback, useState } from "react";
import { Container, type PixiAppProperties, Sprite, Stage, usePixiTicker, withApp } from "react-pixi-fiber";
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

type RotatingBunnyProps = PixiAppProperties &
  BunnyProps & {
    step?: number;
  };

// http://pixijs.io/examples/#/basics/basic.js
// we don't want to pass app prop further down, it will trigger dev warning
const RotatingBunny = withApp(function RotatingBunny({ app, step = 0.1, ...passedProps }: RotatingBunnyProps) {
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
  height: 600,
  width: 800,
};

function BunnyExample() {
  return (
    <Stage options={OPTIONS}>
      <Container>
        <RotatingBunny name="regular" step={0.1} texture={0} x={400} y={300} />
        <RotatingBunny name="cool" step={0.2} texture={1} x={200} y={200} />
        <RotatingBunny name="sport" step={-0.25} texture={2} x={200} y={400} />
        <RotatingBunny name="cyborg" step={-0.1} texture={3} x={600} y={200} />
        <RotatingBunny name="astronaut" step={-0.02} texture={4} x={600} y={400} />
      </Container>
    </Stage>
  );
}

export default BunnyExample;
