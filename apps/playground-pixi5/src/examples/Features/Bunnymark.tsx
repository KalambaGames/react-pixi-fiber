import * as PIXI from "pixi.js";
import { Fragment, useCallback, useLayoutEffect, useState } from "react";
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

const sheet = new PIXI.Spritesheet(PIXI.BaseTexture.from(bunnysImage), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse(() => {});

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

const maxSize = 200000;
const bunniesAddedPerFrame = 100;
const gravity = 0.5;
const maxX = 400;
const maxY = 300;
const minX = 0;
const minY = 0;

const bunnyAnchor = new PIXI.Point(0.5, 1);
const particleContainerProperties = {
  scale: false,
  position: true,
  rotation: false,
  uvs: false,
  tint: false,
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
  const [bunnyTextures, setBunnyTextures] = useState<PIXI.Texture[]>([]);
  const [currentTexture, setCurrentTexture] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  useLayoutEffect(() => {
    setBunnyTextures(bunnyNames.map(name => sheet.textures[name]));
    const currentTexture = 2;
    setBunnys([generateBunny(currentTexture), generateBunny(currentTexture)]);
    setCurrentTexture(currentTexture);
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
      <ParticleContainer maxSize={maxSize} properties={particleContainerProperties}>
        {bunnys.map((bunny, i) => (
          <Sprite anchor={bunnyAnchor} key={i} texture={bunnyTextures[bunny.texture]} x={bunny.x} y={bunny.y} />
        ))}
      </ParticleContainer>
      <Text style={{ fill: 0xffff00, fontSize: 14 }} text={`${bunnys.length} BUNNIES`} x={5} y={5} />
      {/* ParticleContainer and its children cannot be interactive
            so here's a clickable hit area */}
      <Sprite
        interactive
        height={300}
        pointerdown={handlePointerDown}
        pointerup={handlePointerUp}
        texture={PIXI.Texture.EMPTY}
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
