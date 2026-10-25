import { Point, Rectangle, Texture } from "pixi.js";
import { type ComponentProps, type ComponentType, Fragment, useCallback, useState } from "react";
import { type PixiAppProperties, Sprite, Stage, usePixiTicker, withApp } from "react-pixi-fiber";
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

const COLORS = [0x1099bb, 0x10bb99];
const SIZES = [
  { width: 400, height: 300 },
  { width: 300, height: 400 },
];

function SmokeTestExample() {
  const [color, setColor] = useState(0);
  const [count, setCount] = useState(0);
  const [mount, setMount] = useState(false);
  const [size, setSize] = useState(0);

  const backgroundColor = COLORS[color];
  const { width, height } = SIZES[size];

  return (
    <Fragment>
      <table style={{ margin: "0 auto 1.5em", textAlign: "left" }}>
        <tbody>
          <tr>
            <td>Stage mounted: {mount ? "yes" : "no"}</td>
            <td>
              <button onClick={() => setMount(mount => !mount)}>toggle Stage</button>
            </td>
          </tr>
          <tr>
            <td>
              Size: {width}x{height}
            </td>
            <td>
              <button onClick={() => setSize(size => (size ? 0 : 1))}>toggle size</button>
            </td>
          </tr>
          <tr>
            <td>Background: #{backgroundColor.toString(16)}</td>
            <td>
              <button onClick={() => setColor(color => (color ? 0 : 1))}>toggle background</button>
            </td>
          </tr>
          <tr>
            <td>Bunnies: {count}</td>
            <td>
              <button disabled={count === 5} onClick={() => setCount(count => Math.min(5, count + 1))}>
                add bunny
              </button>
              <button disabled={count === 0} onClick={() => setCount(count => Math.max(0, count - 1))}>
                remove bunny
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      {mount && (
        <Stage options={{ backgroundColor, height, width }}>
          {count > 0 && <RotatingBunny x={width / 2} y={height / 2} texture={0} step={0.1} />}
          {count > 1 && <RotatingBunny x={width / 4} y={height / 4} texture={1} step={0.2} />}
          {count > 2 && <RotatingBunny x={width / 4} y={(3 * height) / 4} texture={2} step={-0.25} />}
          {count > 3 && <RotatingBunny x={(3 * width) / 4} y={height / 4} texture={3} step={-0.1} />}
          {count > 4 && <RotatingBunny x={(3 * width) / 4} y={(3 * height) / 4} texture={4} step={-0.02} />}
        </Stage>
      )}
    </Fragment>
  );
}

export default SmokeTestExample;
