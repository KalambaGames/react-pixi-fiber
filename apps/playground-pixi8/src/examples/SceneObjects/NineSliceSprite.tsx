import { Graphics, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { NineSliceSprite, Stage, usePixiApp } from "react-pixi-fiber";

function Frames() {
  const { renderer } = usePixiApp();
  const [texture, setTexture] = useState<Texture>();
  useEffect(() => {
    const frame = new Graphics().roundRect(0, 0, 48, 48, 12).fill(0xffffff).roundRect(8, 8, 32, 32, 6).fill(0x2b4f81);
    const generated = renderer.generateTexture(frame);
    frame.destroy();
    setTexture(generated);
    return () => generated.destroy(true);
  }, [renderer]);
  if (!texture) return null;
  return (
    <>
      <NineSliceSprite
        bottomHeight={12}
        height={100}
        leftWidth={12}
        rightWidth={12}
        texture={texture}
        topHeight={12}
        width={340}
        x={30}
        y={20}
      />
      <NineSliceSprite
        bottomHeight={12}
        height={140}
        leftWidth={12}
        rightWidth={12}
        texture={texture}
        topHeight={12}
        width={80}
        x={30}
        y={140}
      />
      <NineSliceSprite
        bottomHeight={12}
        height={48}
        leftWidth={12}
        rightWidth={12}
        texture={texture}
        topHeight={12}
        width={48}
        x={140}
        y={140}
      />
    </>
  );
}

export default function NineSliceSpriteExample() {
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <Frames />
    </Stage>
  );
}
