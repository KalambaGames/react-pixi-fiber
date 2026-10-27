import { BaseTexture, Spritesheet, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Container, Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

// TexturePacker "hash" format: each frame is a rectangle in bunnys.png.
// The other examples import the same data from ./assets/bunnys.json.
const bunnysData = {
  frames: {
    bunnyAstronaut: { frame: { x: 2, y: 2, w: 26, h: 43 } },
    bunny: { frame: { x: 2, y: 47, w: 26, h: 37 } },
    bunnyCute: { frame: { x: 2, y: 86, w: 26, h: 37 } },
    bunnySporty: { frame: { x: 2, y: 125, w: 26, h: 37 } },
    bunnyRobot: { frame: { x: 2, y: 164, w: 26, h: 37 } },
  },
  meta: {
    image: "bunnys.png",
    size: { w: 30, h: 203 },
    scale: "1",
  },
};

// The other examples import the same hook from ./hooks/useSpritesheet.
// One sheet per image, shared by every component that uses it.
// The cache keeps each sheet while the page is open. An app that unloads a sheet must destroy it.
const loading = new Map<string, Promise<Spritesheet>>();
const ready = new Map<string, Spritesheet>();

function load(image: string, data: { frames: Record<string, unknown> }) {
  let promise = loading.get(image);
  if (!promise) {
    const sheet = new Spritesheet(BaseTexture.from(image), data);
    // parse calls the callback when every frame is ready.
    promise = new Promise<Spritesheet>(resolve =>
      sheet.parse(() => {
        ready.set(image, sheet);
        resolve(sheet);
      })
    );
    // A failed load leaves the cache, so the next mount tries again.
    promise.catch(() => loading.delete(image));
    loading.set(image, promise);
  }
  return promise;
}

// textures is empty until the sheet is ready.
function useSpritesheet<Data extends { frames: Record<string, unknown> }>(image: string, data: Data) {
  const [sheet, setSheet] = useState(() => ready.get(image));

  useEffect(() => {
    if (sheet) return;
    let cancelled = false;
    load(image, data)
      .then(loaded => {
        if (!cancelled) setSheet(loaded);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [image, data, sheet]);

  return { textures: (sheet?.textures ?? {}) as Partial<Record<keyof Data["frames"] & string, Texture>> };
}

function Bunnies() {
  const { textures } = useSpritesheet(bunnys, bunnysData);

  // The frame names are the keys of sheet.textures.
  return Object.entries(textures).map(([name, texture], i) => (
    <Container key={name} x={48 + i * 76} y={150}>
      <Sprite anchor={{ x: 0.5, y: 1 }} scale={2} texture={texture} />
      <Text anchor={{ x: 0.5, y: 0 }} style={{ fill: 0xffffff, fontSize: 11 }} text={name} y={8} />
    </Container>
  ));
}

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

function SpritesheetExample() {
  return (
    <Stage options={OPTIONS}>
      <Bunnies />
    </Stage>
  );
}

export default SpritesheetExample;
