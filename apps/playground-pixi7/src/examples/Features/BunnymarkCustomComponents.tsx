import * as PIXI from "pixi.js";
import { Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  PIXIComponent,
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

type ParticleProps = {
  speedX: number;
  speedY: number;
  texture: PIXI.Texture;
  update: (this: ParticleInstance, particle: ParticleInstance) => void;
};

// Props not known to PixiJS (`speedX`, `speedY`, `update`) are set on the instance by react-pixi-fiber.
class ParticleInstance extends PIXI.Sprite implements Partial<ParticleProps> {
  speedX = 0;
  speedY = 0;
  update?: ParticleProps["update"];
}

const PARTICLE = "Particle";

const Particle = PIXIComponent<ParticleInstance, ParticleProps>(PARTICLE, {
  create: props => new ParticleInstance(props.texture),
  applyProps: function (instance, oldProps, newProps) {
    if (typeof oldProps !== "undefined" && Object.keys(oldProps).length === 0) {
      return;
    }

    this.applyDisplayObjectProps(oldProps, newProps);
  },
});

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
};

const generateBunny = (texture: number): Bunny => ({
  speedX: Math.random() * 10,
  speedY: Math.random() * 10 - 5,
  texture: texture,
});

const moveBunny = function (this: ParticleInstance) {
  this.x += this.speedX;
  this.y += this.speedY;
  this.speedY += gravity;

  if (this.x > maxX) {
    this.speedX *= -1;
    this.x = maxX;
  } else if (this.x < minX) {
    this.speedX *= -1;
    this.x = minX;
  }

  if (this.y > maxY) {
    this.speedY *= -0.85;
    this.y = maxY;
    if (Math.random() > 0.5) {
      this.speedY -= Math.random() * 6;
    }
  } else if (this.y < minY) {
    this.speedY = 0;
    this.y = minY;
  }
};

const CustomBunnymark = withApp(function CustomBunnymark(props: PixiAppProperties) {
  const particleContainer = useRef<PIXI.ParticleContainer>(null);
  const [bunnys, setBunnys] = useState<Bunny[]>([]);
  const { textures: frames } = useSpritesheet(bunnysImage, bunnysData);
  const bunnyTextures = useMemo(() => frames.bunny && bunnyNames.map(name => frames[name] as PIXI.Texture), [frames]);
  const [currentTexture, setCurrentTexture] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // The first bunnies appear when the sprite sheet is ready.
  useLayoutEffect(() => {
    if (!bunnyTextures) return;
    const currentTexture = 2;
    setBunnys([generateBunny(currentTexture), generateBunny(currentTexture)]);
    setCurrentTexture(currentTexture);
  }, [bunnyTextures]);

  const animate = useCallback(() => {
    if (isAdding && bunnyTextures) {
      const addedBunnys: Bunny[] = [];

      if (bunnys.length < maxSize) {
        for (let i = 0; i < bunniesAddedPerFrame; i++) {
          addedBunnys.push(generateBunny(currentTexture));
        }
      }
      const newBunnys = bunnys.concat(addedBunnys);

      setBunnys(newBunnys);
    }

    if (particleContainer.current) {
      (particleContainer.current.children as ParticleInstance[]).forEach(bunny => bunny.update?.(bunny));
    }
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
      <ParticleContainer maxSize={maxSize} properties={particleContainerProperties} ref={particleContainer}>
        {bunnyTextures &&
          bunnys.map((bunny, i) => (
            <Particle
              anchor={bunnyAnchor}
              key={i}
              speedX={bunny.speedX}
              speedY={bunny.speedY}
              texture={bunnyTextures[bunny.texture]}
              update={moveBunny}
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

function CustomBunnymarkExample() {
  return (
    <Stage options={OPTIONS}>
      <CustomBunnymark />
    </Stage>
  );
}

export default CustomBunnymarkExample;
