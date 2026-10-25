import * as PIXI from "pixi.js";
import { Fragment, useCallback, useLayoutEffect, useRef, useState } from "react";
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
import bunnysImage from "./assets/bunnys.png";

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
const maxX = 800;
const maxY = 600;
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
  const [bunnyTextures, setBunnyTextures] = useState<PIXI.Texture[]>([]);
  const [currentTexture, setCurrentTexture] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  useLayoutEffect(() => {
    const bunnyTextures = PIXI.Texture.from(bunnysImage);
    const bunny1 = new PIXI.Texture(bunnyTextures.baseTexture, new PIXI.Rectangle(2, 47, 26, 37));
    const bunny2 = new PIXI.Texture(bunnyTextures.baseTexture, new PIXI.Rectangle(2, 86, 26, 37));
    const bunny3 = new PIXI.Texture(bunnyTextures.baseTexture, new PIXI.Rectangle(2, 125, 26, 37));
    const bunny4 = new PIXI.Texture(bunnyTextures.baseTexture, new PIXI.Rectangle(2, 164, 26, 37));
    const bunny5 = new PIXI.Texture(bunnyTextures.baseTexture, new PIXI.Rectangle(2, 2, 26, 43));
    const created = [bunny1, bunny2, bunny3, bunny4, bunny5];

    setBunnyTextures(created);
    const currentTexture = 2;
    setBunnys([generateBunny(currentTexture), generateBunny(currentTexture)]);
    setCurrentTexture(currentTexture);

    return () => {
      for (const texture of created) texture.destroy();
    };
  }, []);

  const animate = useCallback(() => {
    if (isAdding) {
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
      <ParticleContainer maxSize={maxSize} properties={particleContainerProperties} ref={particleContainer}>
        {bunnys.map((bunny, i) => (
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
        interactive
        height={600}
        pointerdown={handlePointerDown}
        pointerup={handlePointerUp}
        texture={PIXI.Texture.EMPTY}
        width={800}
      />
    </Fragment>
  );
});

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 600,
  width: 800,
};

function CustomBunnymarkExample() {
  return (
    <Stage options={OPTIONS}>
      <CustomBunnymark />
    </Stage>
  );
}

export default CustomBunnymarkExample;
