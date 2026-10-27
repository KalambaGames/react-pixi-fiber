// Every filter and every parameter: https://pixijs.io/filters/examples/
import { useControls } from "leva";
import { GlowFilter as PixiGlowFilter, type GlowFilterOptions } from "pixi-filters";
import { Assets, Point, Spritesheet, Texture, TextureSource } from "pixi.js";
import { useEffect, useState } from "react";
import { PIXIFilter, Sprite, Stage, Text } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

TextureSource.defaultOptions.scaleMode = "nearest";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

const GlowFilter = PIXIFilter("GlowFilter", (props: Partial<GlowFilterOptions>) => new PixiGlowFilter(props));

const centerAnchor = new Point(0.5, 0.5);
const labelStyle = { fill: "white", fontFamily: "Arial", fontSize: 14 };
const scale = new Point(3, 3);

export default function FiltersPropExample() {
  const { glow: on } = useControls({ glow: true });
  const [texture, setTexture] = useState<Texture>();

  // PixiJS 8 loads the sprite sheet asynchronously, so the bunnies render once their texture exists.
  useEffect(() => {
    let cancelled = false;
    bunnySheet.then(sheet => {
      if (cancelled) return;
      setTexture(sheet.textures.bunny);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Creation: the app constructs the filter and keeps it in explicit state (a useState initializer or a useRef),
  // or every render constructs a new one. The reconciler constructs a child element once.
  const [glow] = useState(() => new PixiGlowFilter({ color: 0xffff00, distance: 15, outerStrength: 4 }));

  // Destruction: the app destroys it in an effect cleanup. The library never destroys a filter it did not create,
  // so one dropped without destroy() leaks GPU resources. A child element is destroyed when it or an ancestor unmounts.
  useEffect(() => () => glow.destroy(), [glow]);

  // React rendering flow: under <StrictMode> on React 19, and on a React 18 concurrent root, the dev remount runs the cleanup above, so the
  // filter in state is destroyed while still rendered. The app needs its own guard.
  // The dev remount does not affect a child element: the reconciler keeps the same instance.
  // Order and toggles: the app builds a new array for each change. With elements, JSX order and conditions do it.
  // Props: the app sets parameters on the instance in code, outside React's prop diff, and nothing restores a default.
  // With elements, parameters are props.
  // In return the app owns the instance: one filter can serve several objects, and code outside React can drive it.
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <Text style={labelStyle} text="One glow, two ways to attach it" x={10} y={8} />
      {texture && (
        <>
          <Sprite anchor={centerAnchor} scale={scale} texture={texture} x={120} y={150}>
            {/* The reconciler creates, orders and destroys this filter. */}
            {on && <GlowFilter color={0xffff00} distance={15} outerStrength={4} />}
          </Sprite>
          <Text anchor={centerAnchor} style={labelStyle} text="child element" x={120} y={240} />
          <Sprite
            anchor={centerAnchor}
            filters={on ? [glow] : undefined}
            scale={scale}
            texture={texture}
            x={280}
            y={150}
          />
          <Text anchor={centerAnchor} style={labelStyle} text="filters prop" x={280} y={240} />
        </>
      )}
    </Stage>
  );
}
