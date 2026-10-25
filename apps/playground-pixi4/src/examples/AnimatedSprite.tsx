import { Rectangle, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { AnimatedSprite, Stage } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

// PixiJS 4 has no Texture.fromURL. The texture from Texture.fromImage loads in the background.
function fromURL(url: string) {
  const texture = Texture.fromImage(url);
  return new Promise<Texture>(resolve => {
    if (texture.baseTexture.hasLoaded) resolve(texture);
    else texture.baseTexture.once("loaded", () => resolve(texture));
  });
}

export default function AnimatedSpriteExample() {
  const [textures, setTextures] = useState<Texture[]>();
  useEffect(() => {
    let cancelled = false;
    let frames: Texture[] = [];
    fromURL(bunnys).then(sheet => {
      if (cancelled) return;
      frames = [
        [47, 37],
        [86, 37],
        [125, 37],
        [164, 37],
        [2, 43],
      ].map(([y, height]) => new Texture(sheet.baseTexture, new Rectangle(2, y, 26, height)));
      setTextures(frames);
    });
    return () => {
      cancelled = true;
      for (const frame of frames) frame.destroy();
    };
  }, []);
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      {textures && (
        <AnimatedSprite
          anchor={{ x: 0.5, y: 1 }}
          animationSpeed={0.1}
          ref={sprite => sprite?.play()}
          scale={4}
          textures={textures}
          x={200}
          y={224}
        />
      )}
    </Stage>
  );
}
