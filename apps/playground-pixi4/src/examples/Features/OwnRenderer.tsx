import { Application, Point } from "pixi.js";
import { type ComponentProps, type ComponentType, useCallback, useLayoutEffect, useRef, useState } from "react";
import { type PixiAppProperties, Sprite, Stage, usePixiTicker, withApp } from "react-pixi-fiber";
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

function CustomApplicationExample() {
  const div = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<Application | null>(null);

  useLayoutEffect(() => {
    if (!div.current) {
      return;
    }

    const canvas = document.createElement("canvas");
    div.current.appendChild(canvas);

    const app = new Application({
      backgroundColor: 0xbb9910,
      height: 300,
      view: canvas,
      width: 400,
    });
    setApp(app);

    return function cleanup() {
      setApp(null);
      // Destroy children but not their textures: Bunny textures are shared module-level objects,
      // destroying them here would break every Bunny mounted afterwards.
      app.destroy(true, { children: true });
    };
  }, []);

  return (
    <div ref={div}>
      {app && (
        <Stage app={app}>
          <RotatingBunny scale={3} x={200} y={150} />
        </Stage>
      )}
    </div>
  );
}

export default CustomApplicationExample;
