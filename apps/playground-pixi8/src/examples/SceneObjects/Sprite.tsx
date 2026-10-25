import { Assets, Point, Rectangle, Texture, type Ticker } from "pixi.js";
import {
  type ComponentProps,
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Container, type PixiAppProperties, Sprite, Stage, usePixiTicker, withApp } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

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
const RotatingBunny = withApp(function RotatingBunny({ app, step = 0.1, ...passedProps }: RotatingBunnyProps) {
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
  height: 300,
  width: 400,
};

function BunnyExample() {
  return (
    <Stage options={OPTIONS}>
      <BunnyTexturesProvider>
        <Container>
          <RotatingBunny label="regular" step={0.1} texture={0} x={200} y={150} />
          <RotatingBunny label="cool" step={0.2} texture={1} x={100} y={100} />
          <RotatingBunny label="sport" step={-0.25} texture={2} x={100} y={200} />
          <RotatingBunny label="cyborg" step={-0.1} texture={3} x={300} y={100} />
          <RotatingBunny label="astronaut" step={-0.02} texture={4} x={300} y={200} />
        </Container>
      </BunnyTexturesProvider>
    </Stage>
  );
}

export default BunnyExample;
