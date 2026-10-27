import { Viewport as PixiViewport } from "pixi-viewport";
import type { Application, Sprite as PixiSprite } from "pixi.js";
import { BaseTexture, Point, SCALE_MODES, settings, Spritesheet } from "pixi.js";
import { useEffect, useRef } from "react";
import { PIXIComponent, Sprite, Stage, Text, usePixiApp, usePixiTicker } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const centerAnchor = new Point(0.5, 0.5);
const sheet = new Spritesheet(BaseTexture.from(bunnys), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse();

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
const textures = bunnyNames.map(name => sheet.textures[name]);
const screen = { height: 300, width: 400 };
const world = { height: 600, width: 800 };

// One cluster per frame: the center of the world and its four corners. The corner clusters reach into the corners of
// the screen, so the visitor sees there is more to pan or zoom out to.
const clusterCenters = [
  { radius: 90, x: 400, y: 300 },
  { radius: 130, x: 160, y: 130 },
  { radius: 130, x: 640, y: 130 },
  { radius: 130, x: 160, y: 470 },
  { radius: 130, x: 640, y: 470 },
];
const bunnies = clusterCenters.flatMap((center, cluster) =>
  Array.from({ length: 16 }, (_, index) => {
    const angle = index * 2.4;
    const radius = center.radius * Math.sqrt((index + 0.5) / 16);
    return {
      phase: index,
      texture: textures[cluster],
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  })
);

type ViewportProps = { app: Application };

const Viewport = PIXIComponent<PixiViewport, ViewportProps>("Viewport", {
  // PixiJS 6 handles the pointer in the interaction plugin of the renderer, so the viewport needs it.
  create: ({ app }) =>
    new PixiViewport({
      interaction: app.renderer.plugins.interaction,
      passiveWheel: false,
      screenHeight: screen.height,
      screenWidth: screen.width,
      worldHeight: world.height,
      worldWidth: world.width,
    })
      .drag()
      .pinch()
      .wheel()
      .decelerate()
      .clamp({ direction: "all" })
      .clampZoom({ maxWidth: world.width, minWidth: screen.width / 2 })
      .moveCenter(clusterCenters[0].x, clusterCenters[0].y),
  applyProps: function (instance, oldProps, newProps) {
    const { app, ...newPropsRest } = newProps;
    const { app: oldApp, ...oldPropsRest }: Partial<ViewportProps> = oldProps || {};
    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

function World() {
  const app = usePixiApp();
  const viewport = useRef<PixiViewport>(null);
  const sprites = useRef<PixiSprite[]>([]);

  // A click (not a drag) on a bunny follows it. A drag stops following.
  useEffect(() => {
    const instance = viewport.current!;
    const onClicked = ({ world }: { world: Point }) => {
      const target = sprites.current.find(sprite => Math.hypot(sprite.x - world.x, sprite.y - world.y) < 20);
      if (target) instance.follow(target, { speed: 8 });
    };
    const onDragStart = () => instance.plugins.remove("follow");
    instance.on("clicked", onClicked);
    instance.on("drag-start", onDragStart);
    return () => {
      instance.off("clicked", onClicked);
      instance.off("drag-start", onDragStart);
    };
  }, []);

  // The bunnies circle around their place, so a followed bunny moves the view.
  usePixiTicker(() => {
    const time = performance.now() / 1000;
    bunnies.forEach((bunny, index) => {
      const angle = time + bunny.phase;
      sprites.current[index]?.position.set(bunny.x + Math.cos(angle) * 20, bunny.y + Math.sin(angle) * 20);
    });
  });

  return (
    <Viewport app={app} ref={viewport}>
      {bunnies.map((bunny, index) => (
        <Sprite
          anchor={centerAnchor}
          key={index}
          ref={sprite => {
            if (sprite) sprites.current[index] = sprite;
          }}
          texture={bunny.texture}
          x={bunny.x}
          y={bunny.y}
        />
      ))}
    </Viewport>
  );
}

export default function ViewportExample() {
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: screen.height, width: screen.width }}>
      <World />
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text="Drag to pan, scroll to zoom, click a bunny to follow it"
        x={10}
        y={8}
      />
    </Stage>
  );
}
