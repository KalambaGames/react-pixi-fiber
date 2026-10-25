import { useSpring } from "@react-spring/core";
import type { Graphics as PixiGraphics, Sprite as PixiSprite } from "pixi.js";
import { BaseTexture, Point, Rectangle, SCALE_MODES, Texture } from "pixi.js";
import { useRef } from "react";
import { Graphics, Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

const centerAnchor = new Point(0.5, 0.5);
const bunny = new Texture(Texture.from(bunnys).baseTexture, new Rectangle(2, 47, 26, 37));
const slots = [80, 160, 240, 320].map(x => ({ x, y: 220 }));
const start = { x: 200, y: 110 };

// The adapter has no draw prop for PixiJS 7, so the ref callback draws the slot.
const drawSlot = (graphics: PixiGraphics | null) => {
  graphics?.clear().lineStyle(2, 0xffffff, 0.6).drawRoundedRect(-35, -40, 70, 80, 8);
};

export default function ReactSpringExample() {
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
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text
        anchor={centerAnchor}
        style={{ fill: "white", fontFamily: "Arial", fontSize: 18 }}
        text="Drag the bunny and let go"
        x={200}
        y={30}
      />
      {slots.map(slot => (
        <Graphics key={slot.x} ref={drawSlot} x={slot.x} y={slot.y} />
      ))}
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
    </Stage>
  );
}
