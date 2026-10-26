// Every filter and every parameter: https://pixijs.io/filters/examples/
import { useControls } from "leva";
import { GlowFilter as PixiGlowFilter } from "pixi-filters";
import { Point, Rectangle, SCALE_MODES, settings, Texture } from "pixi.js";
import { useState } from "react";
import { PIXIFilter, Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const GlowFilter = PIXIFilter(
  "GlowFilter",
  (props: { color?: number; distance?: number; innerStrength?: number; outerStrength?: number }) =>
    new PixiGlowFilter(props.distance, props.outerStrength, props.innerStrength, props.color)
);

const centerAnchor = new Point(0.5, 0.5);
const labelStyle = { fill: "white", fontFamily: "Arial", fontSize: 14 };
const scale = new Point(3, 3);
const texture = new Texture(Texture.from(bunnys).baseTexture, new Rectangle(2, 47, 26, 37));

export default function FiltersPropExample() {
  const { glow: on } = useControls({ glow: true });

  // Creation: the app constructs the filter and keeps it in explicit state (a useState initializer or a useRef),
  // or every render constructs a new one. The reconciler constructs a child element once.
  const [glow] = useState(() => new PixiGlowFilter(15, 4, 0, 0xffff00));

  // Destruction: the library never destroys a filter it did not create. PixiJS 4 filters have no destroy(), so this
  // demo has no cleanup effect and only drops its reference on unmount. The reconciler releases a child element.
  // React rendering flow: under <StrictMode> on React 19, and on a React 18 concurrent root, the dev remount runs effect cleanups, so a filter
  // destroyed there is destroyed while still rendered. The app needs its own guard.
  // The dev remount does not affect a child element: the reconciler keeps the same instance.
  // Order and toggles: the app builds a new array for each change. With elements, JSX order and conditions do it.
  // Props: the app sets parameters on the instance in code, outside React's prop diff, and nothing restores a default.
  // With elements, parameters are props.
  // In return the app owns the instance: one filter can serve several objects, and code outside React can drive it.
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text style={labelStyle} text="One glow, two ways to attach it" x={10} y={8} />
      <Sprite anchor={centerAnchor} scale={scale} texture={texture} x={120} y={150}>
        {/* The reconciler creates, orders and releases this filter. */}
        {on && <GlowFilter color={0xffff00} distance={15} outerStrength={4} />}
      </Sprite>
      <Text anchor={centerAnchor} style={labelStyle} text="child element" x={120} y={240} />
      <Sprite anchor={centerAnchor} filters={on ? [glow] : undefined} scale={scale} texture={texture} x={280} y={150} />
      <Text anchor={centerAnchor} style={labelStyle} text="filters prop" x={280} y={240} />
    </Stage>
  );
}
