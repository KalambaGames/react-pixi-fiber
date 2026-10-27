import * as Animated from "animated";
import { Assets, Point, Spritesheet, Texture } from "pixi.js";
import {
  type ComponentProps,
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { applyProps, Sprite, Stage } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

// animated 0.2 attaches its components through a string ref, which React 19 removed. This createAnimatedComponent
// does the same with an object ref. `__PropsOnlyForTests` is animated's AnimatedProps, which its own version uses.
function createAnimatedComponent(Component: ComponentType<any>) {
  return function AnimatedComponent(props: Record<string, unknown>) {
    const node = useRef(null);
    // The constructor attaches to the animated values, so the object detaches at once and attaches in the effect,
    // which leaves nothing behind when React discards a render. It is created once and keeps the first props.
    const propsAnimatedRef = useRef<InstanceType<typeof Animated.__PropsOnlyForTests>>(null);
    if (propsAnimatedRef.current === null) {
      propsAnimatedRef.current = new Animated.__PropsOnlyForTests(props, () =>
        applyProps(node.current, {}, propsAnimatedRef.current!.__getAnimatedValue())
      );
      propsAnimatedRef.current.__detach();
    }
    const propsAnimated = propsAnimatedRef.current;
    useEffect(() => {
      propsAnimated.__attach();
      return () => propsAnimated.__detach();
    }, [propsAnimated]);
    return <Component {...propsAnimated.__getValue()} ref={node} />;
  };
}

const ReactPixiFiberAnimated = {
  ...Animated,
  Sprite: createAnimatedComponent(Sprite),
};

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

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

function BunnyExample() {
  const animationProgress = useRef(new ReactPixiFiberAnimated.Value(0));
  const handleDown = useCallback(() => {
    ReactPixiFiberAnimated.spring(animationProgress.current, { toValue: 1 }).start();
  }, []);
  const handleUp = useCallback(() => {
    ReactPixiFiberAnimated.spring(animationProgress.current, { toValue: 0 }).start();
  }, []);

  return (
    <Stage options={OPTIONS}>
      <BunnyTexturesProvider>
        <Bunny
          anchor={centerAnchor}
          as={ReactPixiFiberAnimated.Sprite}
          eventMode="static"
          onpointerdown={handleDown}
          onpointerup={handleUp}
          position="200,150"
          rotation={animationProgress.current.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.PI * 2],
          })}
          scale={animationProgress.current.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 4],
          })}
        />
      </BunnyTexturesProvider>
    </Stage>
  );
}

export default BunnyExample;
