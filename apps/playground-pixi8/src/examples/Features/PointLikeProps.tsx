import { Point, type Texture, TextureSource } from "pixi.js";
import { type ComponentProps, type ComponentType, createContext, type ReactNode, useContext, useMemo } from "react";
import { Sprite, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

// Scale mode for all textures, will retain pixelation
TextureSource.defaultOptions.scaleMode = "nearest";

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

const centerAnchor = new Point(0.5, 0.5);

const BunnyTextures = createContext<Texture[]>([]);

function BunnyTexturesProvider({ children }: { children: ReactNode }) {
  const { textures: frames } = useSpritesheet(bunnys, bunnysData);
  const textures = useMemo(() => frames.bunny && bunnyNames.map(name => frames[name] as Texture), [frames]);
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

const WIDTH = 400;
const HEIGHT = 300;
const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: HEIGHT,
  width: WIDTH,
};

function PointsExample() {
  return (
    <Stage options={OPTIONS}>
      <BunnyTexturesProvider>
        {/* Position via single value of X as string */}
        <Bunny position="35" />
        {/* Position via single value of X as number */}
        <Bunny position={70} />
        {/* Position via single value of X in array */}
        <Bunny position={[105]} />
        {/* Position via list of X and Y as comma delimited string */}
        <Bunny position="140,140" />
        {/* Position via single value of X as string */}
        <Bunny position={[175, 175]} />
        {/* Position via list of X and Y in array */}
        <Bunny position={{ x: 210, y: 210 }} />
        {/* Position via explicit PIXI.Point */}
        <Bunny position={new Point(245, 245)} />
      </BunnyTexturesProvider>
    </Stage>
  );
}

export default PointsExample;
