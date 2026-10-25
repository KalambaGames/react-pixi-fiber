import { Graphics, SCALE_MODES, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { NineSliceSprite, Stage, usePixiApp } from "react-pixi-fiber";

// PixiJS 5 class: NineSlicePlane
const slices = { bottomHeight: 12, leftWidth: 12, rightWidth: 12, topHeight: 12 };

function Frames() {
  const { renderer } = usePixiApp();
  const [texture, setTexture] = useState<Texture>();
  useEffect(() => {
    const frame = new Graphics()
      .beginFill(0xffffff)
      .drawRoundedRect(0, 0, 48, 48, 12)
      .beginFill(0x2b4f81)
      .drawRoundedRect(8, 8, 32, 32, 6);
    const generated = renderer.generateTexture(frame, SCALE_MODES.LINEAR, 1);
    frame.destroy();
    setTexture(generated);
    return () => generated.destroy(true);
  }, [renderer]);
  if (!texture) return null;
  return (
    <>
      <NineSliceSprite {...slices} height={100} texture={texture} width={340} x={30} y={20} />
      <NineSliceSprite {...slices} height={140} texture={texture} width={80} x={30} y={140} />
      <NineSliceSprite {...slices} height={48} texture={texture} width={48} x={140} y={140} />
    </>
  );
}

export default function NineSliceSpriteExample() {
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Frames />
    </Stage>
  );
}
