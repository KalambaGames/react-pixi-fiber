import type { Graphics as PixiGraphics, Sprite as PixiSprite, Text as PixiText } from "pixi.js";
import { Point, SCALE_MODES, settings, type Texture } from "pixi.js";
import { useEffect, useMemo, useRef } from "react";
import { Container, Graphics, Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
import { create } from "zustand";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const centerAnchor = new Point(0.5, 0.5);
// The astronaut frame is taller, so the bunny stands on its feet and every frame lines up.
const feetAnchor = new Point(0.5, 1);
// Half the height of a bunny at scale 1.5, so the pointer stays in the middle of its body.
const feetOffset = 28;
const topRightAnchor = new Point(1, 0);
const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
// One coin color per bunny, in the order of the textures.
const coinColors = [0xd08a24, 0x9bc12b, 0x25b8a8, 0x5a7090, 0xe040e0];
const roundSeconds = 30;
const textStyle = { fill: "white", fontFamily: "Arial", fontSize: 16, fontWeight: "bold" } as const;

type Coin = { id: number; kind: number; x: number; y: number };
let nextId = 0;
const randomCoin = (kind = Math.floor(Math.random() * coinColors.length)): Coin => ({
  id: nextId++,
  kind,
  x: 20 + Math.random() * 360,
  y: 50 + Math.random() * 210,
});
const startCoins = () => [...coinColors, ...coinColors].map((_, index) => randomCoin(index % coinColors.length));

interface Game {
  click: () => void;
  coins: Coin[];
  end: () => void;
  endsAt: number | null;
  highScore: number;
  kind: number;
  move: (x: number, y: number) => void;
  over: boolean;
  player: { x: number; y: number };
  restart: () => void;
  score: number;
}

// One store for the DOM HUD and the PixiJS scene.
const useGame = create<Game>()((set, get) => ({
  // A click changes the bunny, or starts a new round after the game is over.
  click: () => (get().over ? get().restart() : set(state => ({ kind: (state.kind + 1) % coinColors.length }))),
  coins: startCoins(),
  end: () => set(state => ({ highScore: Math.max(state.highScore, state.score), over: true })),
  endsAt: null,
  highScore: 0,
  kind: 0,
  // The bunny collects only the coins of its own color. A collected coin comes back with a random color.
  // The first coin starts the clock.
  move: (x, y) => {
    const { coins, kind, over } = get();
    const collected = over ? [] : coins.filter(coin => coin.kind === kind && Math.hypot(coin.x - x, coin.y - y) < 30);
    if (collected.length === 0) return set({ player: { x, y } });
    set(state => ({
      coins: state.coins.map(coin => (collected.includes(coin) ? randomCoin() : coin)),
      endsAt: state.endsAt ?? Date.now() + roundSeconds * 1000,
      player: { x, y },
      score: state.score + collected.length,
    }));
  },
  over: false,
  player: { x: 200, y: 150 },
  restart: () => set({ coins: startCoins(), endsAt: null, over: false, score: 0 }),
  score: 0,
}));

// The adapter has no draw prop for PixiJS 5, so ref callbacks draw the coins and the overlay.
const drawCoin = coinColors.map(color => (graphics: PixiGraphics | null) => {
  graphics?.clear().lineStyle(3, 0xffffff, 0.8).beginFill(color).drawCircle(0, 0, 10).endFill();
});
const drawOverlay = (graphics: PixiGraphics | null) => {
  graphics?.clear().beginFill(0x000000, 0.6).drawRect(0, 0, 400, 300).endFill();
};

// A selector re-renders the component only when the score changes.
function Hud() {
  const score = useGame(state => state.score);
  const restart = useGame(state => state.restart);
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 8, marginBottom: 8 }}>
      <strong>Score: {score}</strong>
      <button type="button" onClick={restart}>
        Reset
      </button>
    </div>
  );
}

// The time left changes on every frame, so the ticker writes it to the text without a re-render.
function Clock() {
  const text = useRef<PixiText>(null);
  const end = useGame(state => state.end);
  usePixiTicker(() => {
    const { endsAt, over } = useGame.getState();
    if (!text.current || over) return;
    const left = endsAt === null ? roundSeconds : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    text.current.text = `TIME: ${left}`;
    if (left === 0) end();
  });
  return <Text ref={text} style={textStyle} text={`TIME: ${roundSeconds}`} x={10} y={8} />;
}

function HighScore() {
  const highScore = useGame(state => state.highScore);
  return <Text anchor={topRightAnchor} style={textStyle} text={`HIGH SCORE: ${highScore}`} x={390} y={8} />;
}

function Coins() {
  const coins = useGame(state => state.coins);
  return coins.map(coin => <Graphics key={coin.id} ref={drawCoin[coin.kind]} x={coin.x} y={coin.y} />);
}

function Player({ textures }: { textures: Texture[] }) {
  const sprite = useRef<PixiSprite>(null);
  const click = useGame(state => state.click);
  const kind = useGame(state => state.kind);
  const move = useGame(state => state.move);
  // The position changes on every pointer move, so a subscription moves the sprite without a re-render.
  useEffect(() => useGame.subscribe(({ player }) => sprite.current?.position.set(player.x, player.y + feetOffset)), []);
  return (
    <Sprite
      anchor={feetAnchor}
      interactive
      pointerdown={click}
      // PixiJS 5 sends pointermove to every interactive object, also when the pointer is outside it.
      pointermove={event => move(event.data.global.x, event.data.global.y)}
      ref={sprite}
      scale={1.5}
      texture={textures[kind]}
      x={200}
      y={150 + feetOffset}
    />
  );
}

function GameOver() {
  const over = useGame(state => state.over);
  const score = useGame(state => state.score);
  if (!over) return null;
  return (
    <Container>
      <Graphics ref={drawOverlay} />
      <Text
        anchor={centerAnchor}
        style={{ ...textStyle, align: "center", fontSize: 28 }}
        text={`GAME OVER\nSCORE: ${score}\nCLICK TO PLAY AGAIN`}
        x={200}
        y={150}
      />
    </Container>
  );
}

export default function ZustandExample() {
  const { textures: frames } = useSpritesheet(bunnys, bunnysData);
  const textures = useMemo(() => frames.bunny && bunnyNames.map(name => frames[name] as Texture), [frames]);

  return (
    <div>
      <Hud />
      <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
        <Text
          anchor={centerAnchor}
          style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
          text="Click to change the bunny. It collects the coins of its color."
          x={200}
          y={285}
        />
        <Clock />
        <HighScore />
        <Coins />
        {textures && <Player textures={textures} />}
        <GameOver />
      </Stage>
    </div>
  );
}
