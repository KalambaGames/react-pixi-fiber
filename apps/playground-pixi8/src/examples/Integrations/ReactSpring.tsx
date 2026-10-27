import { useSpring } from "@react-spring/core";
import type { Sprite as PixiSprite } from "pixi.js";
import { GraphicsContext, Point, TextureSource } from "pixi.js";
import { useRef } from "react";
import { Graphics, Sprite, Stage, Text } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

TextureSource.defaultOptions.scaleMode = "nearest";

const centerAnchor = new Point(0.5, 0.5);
const outline = new GraphicsContext().roundRect(-35, -40, 70, 80, 8).stroke({ alpha: 0.6, color: 0xffffff, width: 2 });
const slots = [80, 160, 240, 320].map(x => ({ x, y: 220 }));
const start = { x: 200, y: 110 };

export default function ReactSpringExample() {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const bunny = textures.bunny;
  const sprite = useRef<PixiSprite>(null);
  const grab = useRef<{ x: number; y: number } | null>(null);
  // The spring writes the position to the sprite on every frame, so dragging does not re-render the component.
  const [, api] = useSpring(() => ({
    ...start,
    onChange: ({ value }: { value: typeof start }) => sprite.current?.position.set(value.x, value.y),
  }));

  const release = () => {
    const current = sprite.current;
    if (!grab.current || !current) return;
    grab.current = null;
    const nearest = slots.reduce((best, slot) =>
      Math.hypot(slot.x - current.x, slot.y - current.y) < Math.hypot(best.x - current.x, best.y - current.y)
        ? slot
        : best
    );
    api.start({ ...nearest, config: { friction: 12, tension: 220 } });
  };

  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <Text
        anchor={centerAnchor}
        style={{ fill: "white", fontFamily: "Arial", fontSize: 18 }}
        text="Drag the bunny and let go"
        x={200}
        y={30}
      />
      {slots.map(slot => (
        <Graphics context={outline} key={slot.x} x={slot.x} y={slot.y} />
      ))}
      {bunny && (
        <Sprite
          anchor={centerAnchor}
          cursor="pointer"
          eventMode="static"
          // globalpointermove also fires when the pointer is outside the bunny.
          onglobalpointermove={event => {
            if (!grab.current) return;
            const { x, y } = event.global;
            api.start({ immediate: true, x: x - grab.current.x, y: y - grab.current.y });
          }}
          onpointerdown={event => {
            const { x, y } = event.global;
            grab.current = { x: x - (sprite.current?.x ?? 0), y: y - (sprite.current?.y ?? 0) };
          }}
          onpointerup={release}
          onpointerupoutside={release}
          ref={sprite}
          scale={2}
          texture={bunny}
          x={start.x}
          y={start.y}
        />
      )}
    </Stage>
  );
}
