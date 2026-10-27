import { Particle } from "@react-pixi-fiber/pixi-8";
import { Texture } from "pixi.js";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  type PixiAppProperties,
  ParticleContainer,
  Sprite,
  Stage,
  Text,
  usePixiTicker,
  withApp,
} from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnysImage from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

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

const Bunnymark = withApp(function Bunnymark(props: PixiAppProperties) {
  const [bunnys, setBunnys] = useState<Bunny[]>([]);
  const { textures: frames } = useSpritesheet(bunnysImage, bunnysData);
  const bunnyTextures = useMemo(() => frames.bunny && bunnyNames.map(name => frames[name] as Texture), [frames]);
  const [currentTexture, setCurrentTexture] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // The first bunnies appear when the sprite sheet is ready.
  useEffect(() => {
    if (!bunnyTextures) return;
    const currentTexture = 2;
    setBunnys([generateBunny(currentTexture), generateBunny(currentTexture)]);
    setCurrentTexture(currentTexture);
  }, [bunnyTextures]);

  const animate = useCallback(() => {
    const addedBunnys: Bunny[] = [];

    if (isAdding && bunnyTextures) {
      if (bunnys.length < maxSize) {
        for (let i = 0; i < bunniesAddedPerFrame; i++) {
          addedBunnys.push(generateBunny(currentTexture));
        }
      }
    }

    const newBunnys = bunnys.concat(addedBunnys).map(moveBunny);

    setBunnys(newBunnys);
  }, [bunnyTextures, bunnys, currentTexture, isAdding]);

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
        {bunnyTextures &&
          bunnys.map((bunny, i) => (
            <Particle
              anchorX={0.5}
              anchorY={1}
              key={i}
              texture={bunnyTextures[bunny.texture]}
              x={bunny.x}
              y={bunny.y}
            />
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

function BunnymarkExample() {
  return (
    <Stage options={OPTIONS}>
      <Bunnymark />
    </Stage>
  );
}

export default BunnymarkExample;
