import { Application, Assets, Point, Spritesheet, Texture, type Ticker } from "pixi.js";
import {
  type ComponentProps,
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { type PixiAppProperties, Sprite, Stage, usePixiTicker, withApp } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

const centerAnchor = new Point(0.5, 0.5);

// PixiJS 8 loads the sprite sheet asynchronously, so the bunnies render once their textures exist.
const BunnyTextures = createContext<Texture[]>([]);

function BunnyTexturesProvider({ children }: { children: ReactNode }) {
  const [textures, setTextures] = useState<Texture[]>();
  useEffect(() => {
    let cancelled = false;
    bunnySheet.then(sheet => {
      if (cancelled) return;
      setTextures(bunnyNames.map(name => sheet.textures[name]));
    });
    return () => {
      cancelled = true;
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

function CustomApplicationExample() {
  const div = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<Application | null>(null);

  useLayoutEffect(() => {
    if (!div.current) {
      return;
    }

    const canvas = document.createElement("canvas");
    div.current.appendChild(canvas);

    // PixiJS 8 initializes an Application asynchronously.
    let initialized = false;
    let cancelled = false;
    const app = new Application();
    app
      .init({
        backgroundColor: 0xbb9910,
        canvas,
        height: 300,
        width: 400,
      })
      .then(() => {
        initialized = true;
        if (cancelled) {
          app.destroy(true, { children: true });
        } else {
          setApp(app);
        }
      });

    return function cleanup() {
      cancelled = true;
      setApp(null);
      // Destroy children but not their textures: the Bunny textures are destroyed by their provider.
      if (initialized) {
        app.destroy(true, { children: true });
      }
    };
  }, []);

  return (
    <div ref={div}>
      {app && (
        <Stage app={app}>
          <BunnyTexturesProvider>
            <RotatingBunny scale={3} x={200} y={150} />
          </BunnyTexturesProvider>
        </Stage>
      )}
    </div>
  );
}

export default CustomApplicationExample;
