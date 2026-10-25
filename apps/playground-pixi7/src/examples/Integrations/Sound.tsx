import { type Sound, sound } from "@pixi/sound";
import type { Sprite as PixiSprite } from "pixi.js";
import { BaseTexture, Point, Rectangle, SCALE_MODES, Texture } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";
import sounds from "./assets/sounds.mp3";

BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

const centerAnchor = new Point(0.5, 0.5);
// The frames differ in height, so the bunnies stand on their feet like in the AnimatedSprite example.
const feetAnchor = new Point(0.5, 1);
const bunnyTextures = Texture.from(bunnys);
const textures = [
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 47, 26, 37)),
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 86, 26, 37)),
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 125, 26, 37)),
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 164, 26, 37)),
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 2, 26, 43)),
];
const textStyle = { fill: "white", fontFamily: "Arial", fontSize: 14 } as const;

// One audio sprite holds all the sounds. Each sound starts on a full second.
// Sounds: Interface Sounds by Kenney (CC0).
const sprites = {
  bong: { end: 0.4, start: 0 },
  chime: { end: 4.4, start: 4 },
  drop: { end: 1.4, start: 1 },
  glass: { end: 2.4, start: 2 },
  pluck: { end: 3.4, start: 3 },
};
const names = ["bong", "drop", "glass", "pluck", "chime"];

// A clicked bunny grows and the ticker shrinks it back, without a re-render.
function Bunnies({ effects }: { effects: Sound }) {
  const bunnies = useRef<PixiSprite[]>([]);
  const bumps = useRef(textures.map(() => 0));

  usePixiTicker(() => {
    bunnies.current.forEach((bunny, index) => {
      bumps.current[index] *= 0.85;
      bunny.scale.set(2 + bumps.current[index]);
    });
  });

  return textures.map((texture, index) => (
    <Sprite
      anchor={feetAnchor}
      cursor="pointer"
      eventMode="static"
      key={names[index]}
      onpointerdown={() => {
        bumps.current[index] = 0.8;
        effects.play(names[index]);
      }}
      ref={sprite => {
        if (sprite) bunnies.current[index] = sprite;
      }}
      scale={2}
      texture={texture}
      x={80 + index * 60}
      y={190}
    />
  ));
}

export default function SoundExample() {
  const [effects, setEffects] = useState<Sound>();
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    setEffects(sound.add("bunnies", { preload: true, sprites, url: sounds }));
    return () => {
      sound.remove("bunnies");
    };
  }, []);

  useEffect(() => {
    if (!effects) return;
    effects.muted = muted;
    effects.volume = volume;
  }, [effects, muted, volume]);

  return (
    <div>
      <div style={{ alignItems: "center", display: "flex", gap: 8, marginBottom: 8 }}>
        <label style={{ alignItems: "center", display: "flex", gap: 8 }}>
          Volume
          <input
            max={1}
            min={0}
            onChange={event => setVolume(Number(event.target.value))}
            step={0.05}
            type="range"
            value={volume}
          />
        </label>
        <button type="button" onClick={() => setMuted(!muted)}>
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>
      <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
        <Text
          anchor={centerAnchor}
          style={{ ...textStyle, align: "center", fontSize: 16 }}
          text={"Click a bunny to play its sound.\nBrowsers play sound only after a click on the page."}
          x={200}
          y={60}
        />
        {effects && <Bunnies effects={effects} />}
        {names.map((name, index) => (
          <Text anchor={centerAnchor} key={name} style={textStyle} text={name} x={80 + index * 60} y={210} />
        ))}
        <Text
          anchor={centerAnchor}
          style={{ ...textStyle, fontSize: 12 }}
          text="Sounds: Interface Sounds by Kenney (CC0)"
          x={200}
          y={285}
        />
      </Stage>
    </div>
  );
}
