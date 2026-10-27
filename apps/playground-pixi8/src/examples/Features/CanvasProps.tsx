import { Point, type Texture } from "pixi.js";
import { type ComponentProps, type ComponentType, createContext, type ReactNode, useContext, useMemo } from "react";
import { Sprite, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

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

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

function CanvasPropsExample() {
  return (
    <>
      <style>{".bordered { border: 5px solid #222; }"}</style>
      <Stage className="bordered" options={OPTIONS} style={{ borderRadius: 16 }}>
        <BunnyTexturesProvider>
          <Bunny x={200} y={150} />
        </BunnyTexturesProvider>
      </Stage>
    </>
  );
}

export default CanvasPropsExample;
