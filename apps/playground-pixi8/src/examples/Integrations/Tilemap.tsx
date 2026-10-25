import { CompositeTilemap } from "@pixi/tilemap";
import type { Container as PixiContainer } from "pixi.js";
import { Assets, Rectangle, Texture, TextureSource } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Container, PIXIComponent, Stage, Text, usePixiTicker } from "react-pixi-fiber";
import tinyTown from "./assets/tiny-town.png";

TextureSource.defaultOptions.scaleMode = "nearest";

const screen = { height: 300, width: 400 };
const tileSize = 16;
const scale = 2;
const columns = 200;
const rows = 200;
const speed = 6;
// A tilemap draws at most 16 384 tiles (16-bit indices), so the level is split into chunks of rows.
const chunkRows = 40;
const chunks = Array.from({ length: rows / chunkRows }, (_, index) => index * chunkRows);

// Tiles of the Tiny Town sheet by Kenney (CC0): 12 columns of 16 × 16 px.
const grass = [0, 0, 0, 0, 0, 1, 2];
const road = 43;
// A tall tree is two tiles, the top above the trunk.
const plants = [[5], [17], [27], [28], [29], [3, 15], [4, 16]];
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

// The level: grass everywhere, a road every 25 tiles, and trees and bushes between the roads.
const level = Array.from({ length: rows }, (_, row) =>
  Array.from({ length: columns }, (_, column) => {
    const onRoad = row % 25 === 12 || column % 25 === 12;
    return {
      ground: onRoad ? road : pick(grass),
      plant: !onRoad && Math.random() < 0.15 ? pick(plants) : undefined,
    };
  })
);

type LevelProps = { firstRow: number; tiles: Texture[] };

// The tilemap draws every tile of the level in one batch, so tens of thousands of tiles stay cheap.
const Level = PIXIComponent<CompositeTilemap, LevelProps>("Level", {
  create: ({ firstRow, tiles }) => {
    const tilemap = new CompositeTilemap();
    level.slice(firstRow, firstRow + chunkRows).forEach((cells, offset) => {
      const row = firstRow + offset;
      cells.forEach(({ ground, plant }, column) => {
        tilemap.tile(tiles[ground], column * tileSize, row * tileSize);
        plant?.forEach((tile, index) =>
          tilemap.tile(tiles[tile], column * tileSize, (row - plant.length + 1 + index) * tileSize)
        );
      });
    });
    return tilemap;
  },
  applyProps: function (instance, oldProps, newProps) {
    const { firstRow, tiles, ...newPropsRest } = newProps;
    const { firstRow: oldFirstRow, tiles: oldTiles, ...oldPropsRest }: Partial<LevelProps> = oldProps || {};
    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

const directions: Record<string, [number, number]> = {
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
  KeyS: [0, 1],
  KeyW: [0, -1],
};

// The camera moves the level against the pressed keys. It writes the position on every frame, without a re-render.
function Camera({ tiles }: { tiles: Texture[] }) {
  const camera = useRef<PixiContainer>(null);
  const pressed = useRef(new Set<string>());
  // A released key still moves the camera on the next frame, so a short tap moves it too.
  const released = useRef(new Set<string>());

  useEffect(() => {
    const keys = pressed.current;
    const releasedKeys = released.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!directions[event.code]) return;
      event.preventDefault();
      keys.add(event.code);
    };
    // The key code stays the same while Shift is down. A frame that loses focus gets no keyup, so it releases every key.
    const onKeyUp = (event: KeyboardEvent) => releasedKeys.add(event.code);
    const onBlur = () => keys.clear();
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  usePixiTicker(() => {
    if (!camera.current) return;
    let [x, y] = [camera.current.x, camera.current.y];
    for (const key of pressed.current) {
      x -= directions[key][0] * speed;
      y -= directions[key][1] * speed;
    }
    for (const key of released.current) pressed.current.delete(key);
    released.current.clear();
    const minX = screen.width - columns * tileSize * scale;
    const minY = screen.height - rows * tileSize * scale;
    camera.current.position.set(Math.min(0, Math.max(minX, x)), Math.min(0, Math.max(minY, y)));
  });

  return (
    <Container ref={camera} scale={scale}>
      {chunks.map(firstRow => (
        <Level firstRow={firstRow} key={firstRow} tiles={tiles} />
      ))}
    </Container>
  );
}

export default function TilemapExample() {
  const [tiles, setTiles] = useState<Texture[]>();

  // PixiJS 8 loads the tile sheet asynchronously, so the level renders once its textures exist.
  useEffect(() => {
    let cancelled = false;
    let created: Texture[] = [];
    Assets.load<Texture>(tinyTown).then(({ source }) => {
      if (cancelled) return;
      created = Array.from(
        { length: 132 },
        (_, index) =>
          new Texture({
            frame: new Rectangle((index % 12) * tileSize, Math.floor(index / 12) * tileSize, tileSize, tileSize),
            source,
          })
      );
      setTiles(created);
    });
    return () => {
      cancelled = true;
      for (const texture of created) texture.destroy();
    };
  }, []);

  return (
    <Stage options={{ background: 0x5a9e3a, height: screen.height, width: screen.width }}>
      {tiles && <Camera tiles={tiles} />}
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14, stroke: { color: 0x000000, width: 3 } }}
        text={`${columns * rows} tiles. Click, then move with the arrow keys or WASD.\nTiles: Tiny Town by Kenney (CC0)`}
        x={10}
        y={8}
      />
    </Stage>
  );
}
