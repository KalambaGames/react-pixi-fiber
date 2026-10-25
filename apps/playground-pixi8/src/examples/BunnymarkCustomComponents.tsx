import * as PIXI from "pixi.js";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
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
  anchorX: number;
  anchorY: number;
  speedX: number;
  speedY: number;
  texture: PIXI.Texture;
  update: (this: ParticleInstance, particle: ParticleInstance) => void;
};

// Props not known to PixiJS (`speedX`, `speedY`, `update`) are set on the instance by react-pixi-fiber.
// A PixiJS 8 ParticleContainer holds Particles, so the instance extends PIXI.Particle, not PIXI.Sprite.
class ParticleInstance extends PIXI.Particle implements Partial<ParticleProps> {
  speedX = 0;
  speedY = 0;
  update?: ParticleProps["update"];
}

// The PixiJS 8 adapter defines a `Particle` tag already.
const PARTICLE = "CustomParticle";

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

  // PixiJS 8 loads the sprite sheet asynchronously.
  useEffect(() => {
    let cancelled = false;
    let created: PIXI.Texture[] = [];
    PIXI.Assets.load<PIXI.Texture>(bunnysImage).then(({ source }) => {
      if (cancelled) return;
      const bunny1 = new PIXI.Texture({ frame: new PIXI.Rectangle(2, 47, 26, 37), source });
      const bunny2 = new PIXI.Texture({ frame: new PIXI.Rectangle(2, 86, 26, 37), source });
      const bunny3 = new PIXI.Texture({ frame: new PIXI.Rectangle(2, 125, 26, 37), source });
      const bunny4 = new PIXI.Texture({ frame: new PIXI.Rectangle(2, 164, 26, 37), source });
      const bunny5 = new PIXI.Texture({ frame: new PIXI.Rectangle(2, 2, 26, 43), source });
      created = [bunny1, bunny2, bunny3, bunny4, bunny5];

      setBunnyTextures(created);
      const currentTexture = 2;
      setBunnys([generateBunny(currentTexture), generateBunny(currentTexture)]);
      setCurrentTexture(currentTexture);
    });
    return () => {
      cancelled = true;
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
      (particleContainer.current.particleChildren as ParticleInstance[]).forEach(bunny => bunny.update?.(bunny));
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
      <ParticleContainer dynamicProperties={particleContainerProperties} ref={particleContainer}>
        {bunnys.map((bunny, i) => (
          <Particle
            anchorX={0.5}
            anchorY={1}
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
        height={600}
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
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
