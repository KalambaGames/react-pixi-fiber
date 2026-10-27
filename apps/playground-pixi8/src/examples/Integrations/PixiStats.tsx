import { Particle } from "@react-pixi-fiber/pixi-8";
import { Assets, Spritesheet, Texture } from "pixi.js";
import { Stats } from "pixi-stats";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  type PixiAppProperties,
  ParticleContainer,
  Sprite,
  Stage,
  Text,
  usePixiTicker,
  withApp,
} from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnysImage from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnysImage).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

const maxSize = 200000;
const bunniesAddedPerFrame = 100;
const gravity = 0.5;
const maxX = 400;
const maxY = 300;
const minX = 0;
const minY = 0;

// PixiJS 8 names the ParticleContainer properties `vertex` (scale) and `color` (tint).
const particleContainerProperties = {
  vertex: false,
  position: true,
  rotation: false,
  uvs: false,
  color: false,
};

type Bunny = {
  speedX: number;
  speedY: number;
  texture: number;
  x: number;
  y: number;
};

const generateBunny = (texture: number): Bunny => ({
  speedX: Math.random() * 10,
  speedY: Math.random() * 10 - 5,
  texture: texture,
  x: 0,
  y: 0,
});

const moveBunny = (bunny: Bunny): Bunny => {
  const movedBunny = { ...bunny };

  movedBunny.x += movedBunny.speedX;
  movedBunny.y += movedBunny.speedY;
  movedBunny.speedY += gravity;

  if (movedBunny.x > maxX) {
    movedBunny.speedX *= -1;
    movedBunny.x = maxX;
  } else if (movedBunny.x < minX) {
    movedBunny.speedX *= -1;
    movedBunny.x = minX;
  }

  if (movedBunny.y > maxY) {
    movedBunny.speedY *= -0.85;
    movedBunny.y = maxY;
    if (Math.random() > 0.5) {
      movedBunny.speedY -= Math.random() * 6;
    }
  } else if (movedBunny.y < minY) {
    movedBunny.speedY = 0;
    movedBunny.y = minY;
  }

  return movedBunny;
};

const Bunnymark = withApp(function Bunnymark({ app, overlay }: PixiAppProperties & { overlay: HTMLElement }) {
  const [bunnys, setBunnys] = useState<Bunny[]>([]);
  const [bunnyTextures, setBunnyTextures] = useState<Texture[]>([]);
  const [currentTexture, setCurrentTexture] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // pixi-stats counts frames on the app ticker and draw calls on the renderer, and draws its panel into the overlay.
  useEffect(() => {
    const stats = new Stats(app.renderer, app.ticker, overlay);
    return () => stats.removeDomElement();
  }, [app, overlay]);

  // PixiJS 8 loads the sprite sheet asynchronously.
  useEffect(() => {
    let cancelled = false;
    bunnySheet.then(sheet => {
      if (cancelled) return;
      setBunnyTextures(bunnyNames.map(name => sheet.textures[name]));
      const currentTexture = 2;
      setBunnys([generateBunny(currentTexture), generateBunny(currentTexture)]);
      setCurrentTexture(currentTexture);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const animate = useCallback(() => {
    const addedBunnys: Bunny[] = [];

    if (isAdding) {
      if (bunnys.length < maxSize) {
        for (let i = 0; i < bunniesAddedPerFrame; i++) {
          addedBunnys.push(generateBunny(currentTexture));
        }
      }
    }

    const newBunnys = bunnys.concat(addedBunnys).map(moveBunny);

    setBunnys(newBunnys);
  }, [bunnys, currentTexture, isAdding]);

  usePixiTicker(animate);

  const handlePointerDown = useCallback(() => {
    setIsAdding(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setCurrentTexture(currentTexture => (currentTexture + 1) % 5);
    setIsAdding(false);
  }, []);

  return (
    <Fragment>
      {/* PixiJS 8 renders Particle children in a ParticleContainer, not Sprites */}
      <ParticleContainer dynamicProperties={particleContainerProperties}>
        {bunnys.map((bunny, i) => (
          <Particle anchorX={0.5} anchorY={1} key={i} texture={bunnyTextures[bunny.texture]} x={bunny.x} y={bunny.y} />
        ))}
      </ParticleContainer>
      <Text style={{ fill: 0xffff00, fontSize: 14 }} text={`${bunnys.length} BUNNIES`} x={5} y={5} />
      {/* ParticleContainer and its children cannot be interactive
            so here's a clickable hit area */}
      <Sprite
        eventMode="static"
        height={300}
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
        texture={Texture.EMPTY}
        width={400}
      />
    </Fragment>
  );
});

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

function PixiStatsExample() {
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  return (
    <div style={{ position: "relative", width: OPTIONS.width }}>
      <Stage options={OPTIONS}>{overlay && <Bunnymark overlay={overlay} />}</Stage>
      {/* The stats panel shows FPS, MS and MB, and DC (draw calls) and TC (textures). A click switches the panel.
       * pixi-stats draws it at 200 × 120 px, so the overlay shows it at half size. */}
      <div
        ref={setOverlay}
        style={{ position: "absolute", right: 0, top: 0, transform: "scale(0.5)", transformOrigin: "top right" }}
      />
    </div>
  );
}

export default PixiStatsExample;
