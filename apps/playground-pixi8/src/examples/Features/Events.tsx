import { Assets, type FederatedPointerEvent, Point, Rectangle, Texture, TextureSource } from "pixi.js";
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
import { Sprite, Stage, Text } from "react-pixi-fiber";
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

// Scale mode for all textures, will retain pixelation
TextureSource.defaultOptions.scaleMode = "nearest";

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

// http://pixijs.io/examples/#/basics/click.js
function ClickExample() {
  const [scale, setScale] = useState(1);
  // The right button shrinks the bunny, any other button grows it.
  const handlePointerDown = useCallback((event: FederatedPointerEvent) => {
    const shrink = event.button === 2;
    setScale(scale => (shrink ? scale / 1.25 : scale * 1.25));
  }, []);

  return (
    // The canvas keeps the right button for the bunny, without the browser menu.
    <Stage onContextMenu={event => event.preventDefault()} options={OPTIONS}>
      <BunnyTexturesProvider>
        <Bunny
          // Shows hand cursor
          cursor="pointer"
          // Opt-in to interactivity
          eventMode="static"
          // Pointers normalize touch and mouse
          onpointerdown={handlePointerDown}
          scale={new Point(scale, scale)}
          x={200}
          y={150}
        />
        <Text
          style={{ fill: "white", fontSize: 16 }}
          text="Click the bunny to grow it. Right-click it to shrink it."
          x={10}
          y={10}
        />
      </BunnyTexturesProvider>
    </Stage>
  );
}

export default ClickExample;
