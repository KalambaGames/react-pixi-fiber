import { type Sound, sound } from "@pixi/sound";
import type { Sprite as PixiSprite } from "pixi.js";
import { Assets, Point, Spritesheet, Texture, TextureSource } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import sounds from "./assets/sounds.mp3";

TextureSource.defaultOptions.scaleMode = "nearest";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

const centerAnchor = new Point(0.5, 0.5);
// The frames differ in height, so the bunnies stand on their feet like in the AnimatedSprite example.
const feetAnchor = new Point(0.5, 1);
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
function Bunnies({ effects, textures }: { effects: Sound; textures: Texture[] }) {
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
  const [textures, setTextures] = useState<Texture[]>();
  const [effects, setEffects] = useState<Sound>();
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // PixiJS 8 loads the sprite sheet asynchronously, so the bunnies render once their textures exist.
  useEffect(() => {
    let cancelled = false;
    bunnySheet.then(sheet => {
      if (cancelled) return;
      setTextures(bunnyNames.map(name => sheet.textures[name]));
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
        <Text
          anchor={centerAnchor}
          style={{ ...textStyle, align: "center", fontSize: 16 }}
          text={"Click a bunny to play its sound.\nBrowsers play sound only after a click on the page."}
          x={200}
          y={60}
        />
        {effects && textures && <Bunnies effects={effects} textures={textures} />}
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
