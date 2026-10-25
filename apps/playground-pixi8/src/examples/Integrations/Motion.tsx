import { animate, motionValue } from "motion";
import type { Sprite as PixiSprite } from "pixi.js";
import { Assets, Point, Rectangle, Texture, TextureSource } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

TextureSource.defaultOptions.scaleMode = "nearest";

const centerAnchor = new Point(0.5, 0.5);
// The bunny squashes towards the ground, so it scales from its feet.
const feetAnchor = new Point(0.5, 1);
const spring = { damping: 9, stiffness: 400, type: "spring" } as const;

export default function MotionExample() {
  const [bunny, setBunny] = useState<Texture>();
  const sprite = useRef<PixiSprite>(null);
  const hovered = useRef(false);
  const [scaleX] = useState(() => motionValue(3));
  const [scaleY] = useState(() => motionValue(3));

  // PixiJS 8 loads the sprite sheet asynchronously, so the bunny renders once its texture exists.
  useEffect(() => {
    let cancelled = false;
    let created: Texture | undefined;
    Assets.load<Texture>(bunnys).then(({ source }) => {
      if (cancelled) return;
      created = new Texture({ frame: new Rectangle(2, 47, 26, 37), source });
      setBunny(created);
    });
    return () => {
      cancelled = true;
      created?.destroy();
    };
  }, []);

  // The motion values write to the sprite, so hover and press do not re-render the component.
  useEffect(() => {
    const stops = [
      scaleX.on("change", value => sprite.current?.scale.set(value, sprite.current.scale.y)),
      scaleY.on("change", value => sprite.current?.scale.set(sprite.current.scale.x, value)),
    ];
    return () => {
      for (const stop of stops) stop();
    };
  }, [scaleX, scaleY]);

  const springTo = (x: number, y: number) => {
    animate(scaleX, x, spring);
    animate(scaleY, y, spring);
  };
  const rest = () => (hovered.current ? springTo(3.6, 3.6) : springTo(3, 3));

  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <Text
        anchor={centerAnchor}
        style={{ fill: "white", fontFamily: "Arial", fontSize: 18 }}
        text="Hover and press the bunny"
        x={200}
        y={30}
      />
      {bunny && (
        <Sprite
          anchor={feetAnchor}
          cursor="pointer"
          eventMode="static"
          onpointerdown={() => springTo(4.4, 2.2)}
          onpointerout={() => {
            hovered.current = false;
            rest();
          }}
          onpointerover={() => {
            hovered.current = true;
            rest();
          }}
          onpointerup={rest}
          onpointerupoutside={rest}
          ref={sprite}
          scale={3}
          texture={bunny}
          x={200}
          y={240}
        />
      )}
    </Stage>
  );
}
