import { Assets, Point, Rectangle, Texture, type Ticker } from "pixi.js";
import React, {
  type ComponentProps,
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
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

// PixiJS 8 loads the sprite sheet asynchronously, so the bunnies render once their textures exist.
const BunnyTextures = createContext<Texture[]>([]);

function BunnyTexturesProvider({ children }: { children: ReactNode }) {
  const [textures, setTextures] = useState<Texture[]>();
  useEffect(() => {
    let cancelled = false;
    let created: Texture[] = [];
    Assets.load<Texture>(bunnys).then(({ source }) => {
      if (cancelled) return;
      created = [
        new Texture({ frame: new Rectangle(2, 47, 26, 37), source }),
        new Texture({ frame: new Rectangle(2, 86, 26, 37), source }),
        new Texture({ frame: new Rectangle(2, 125, 26, 37), source }),
        new Texture({ frame: new Rectangle(2, 164, 26, 37), source }),
        new Texture({ frame: new Rectangle(2, 2, 26, 43), source }),
      ];
      setTextures(created);
    });
    return () => {
      cancelled = true;
      for (const texture of created) texture.destroy();
    };
  }, []);
  return textures ? <BunnyTextures.Provider value={textures}>{children}</BunnyTextures.Provider> : null;
}

type BunnyProps = Omit<ComponentProps<typeof Sprite>, "texture"> & {
  // Component used to render the bunny, e.g. `Animated.Sprite`
  as?: ComponentType<any>;
  // Index of the bunny in the sprite sheet
  texture?: number;
};

function Bunny({ as: Component = Sprite, texture = 0, ...passedProps }: BunnyProps) {
  const textures = useContext(BunnyTextures);
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
    (ticker: Ticker) => {
      // just for fun, let's rotate mr rabbit a little
      // delta is 1 if running at 100% performance
      // creates frame-independent tranformation
      setRotation(rotation => rotation + step * ticker.deltaTime);
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
      <BunnyTexturesProvider>
        <Container>
          <RotatingBunny bunnyName="Regular" id={1} label="regular" step={0.1} texture={0} x={400} y={300} />
          <RotatingBunny bunnyName="Cool" id={2} label="cool" step={0.2} texture={1} x={200} y={200} />
          <RotatingBunny bunnyName="Sport" id="3" label="sport" step={-0.25} texture={2} x={200} y={400} />
          <React.StrictMode>
            {/* id will be reported in this tree as invalid prop (string instead of number) */}
            <RotatingBunny bunnyName="Cyborg" id="4" label="cyborg" step={-0.1} texture={3} x={600} y={200} />
            {/* bunnyName will be reported in this tree as unknown prop */}
            <RotatingBunny bunnyName="Astronaut" id={5} label="astronaut" step={-0.02} texture={4} x={600} y={400} />
          </React.StrictMode>
        </Container>
      </BunnyTexturesProvider>
    </Stage>
  );
}

export default CustomPIXIPropertyExample;
