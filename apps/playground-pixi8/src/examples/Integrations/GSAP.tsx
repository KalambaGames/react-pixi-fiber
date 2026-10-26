import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import * as PIXI from "pixi.js";
import { type Application, Assets, Point, Rectangle, Texture, TextureSource } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

// PixiPlugin animates PixiJS properties such as scale and alpha through the `pixi` key.
gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

TextureSource.defaultOptions.scaleMode = "nearest";

const centerAnchor = new Point(0.5, 0.5);
// The frames differ in height, so the bunnies stand on their feet like in the AnimatedSprite example.
const feetAnchor = new Point(0.5, 1);

export default function GSAPExample() {
  const [app, setApp] = useState<Application>();
  const [textures, setTextures] = useState<Texture[]>();
  const logo = useRef<PIXI.Text>(null);
  const bunnies = useRef<PIXI.Sprite[]>([]);
  const timeline = useRef<gsap.core.Timeline>(null);

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

  // Stage renders its children after `onInit`, because PixiJS 8 creates the application asynchronously.
  // The sprite sheet can load before `onInit`, so the intro waits for both.
  // The timeline changes the PixiJS objects directly, so the buttons do not re-render the component.
  useEffect(() => {
    if (!app || !textures) return;
    const intro = gsap
      .timeline()
      .from(logo.current, { duration: 1.2, ease: "bounce.out", pixi: { alpha: 0, y: -60 } })
      .from(bunnies.current, {
        duration: 0.6,
        ease: "back.out(3)",
        pixi: { alpha: 0, scale: 0, y: 320 },
        stagger: 0.12,
      });
    timeline.current = intro;
    return () => {
      intro.revert();
    };
  }, [app, textures]);

  const play = () => {
    const intro = timeline.current;
    if (intro?.progress() === 1) intro.restart();
    else intro?.play();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={play}>
          Play
        </button>
        <button type="button" onClick={() => timeline.current?.pause()}>
          Pause
        </button>
        <button type="button" onClick={() => timeline.current?.reverse()}>
          Reverse
        </button>
      </div>
      <Stage onInit={setApp} options={{ background: 0x1099bb, height: 300, width: 400 }}>
        {textures && (
          <Text
            anchor={centerAnchor}
            ref={logo}
            style={{ fill: "white", fontFamily: "Arial", fontSize: 36, fontWeight: "bold" }}
            text="react-pixi-fiber"
            x={200}
            y={100}
          />
        )}
        {textures?.map((texture, index) => (
          <Sprite
            anchor={feetAnchor}
            key={index}
            ref={sprite => {
              if (sprite) bunnies.current[index] = sprite;
            }}
            scale={2}
            texture={texture}
            x={80 + index * 60}
            y={237}
          />
        ))}
      </Stage>
    </div>
  );
}
