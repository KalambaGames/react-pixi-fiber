import type { BillboardMode } from "@pixi/3d";
import { Camera3D, Container3D, DirectionalLight, OrbitCamera, Sprite3D, View3D } from "@react-pixi-fiber/pixi3d-0";
import { useControls } from "leva";
import { TextureSource } from "pixi.js";
import { useState } from "react";
import { Stage, usePixiTicker } from "react-pixi-fiber";

import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";
import { Floor, fog } from "./components/Floor";

TextureSource.defaultOptions.scaleMode = "nearest";

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
const start: [number, number, number] = [0, 2, 6];
const target: [number, number, number] = [0, 0.5, 0];

// usePixiTicker reads the application, so it runs in a child of the Stage.
function Ring({ billboardMode }: { billboardMode: BillboardMode }) {
  const { textures } = useSpritesheet(bunnys, bunnysData);
  const [turn, setTurn] = useState(0);
  usePixiTicker(ticker => setTurn(turn => turn + 0.01 * ticker.deltaTime));
  if (!textures.bunny) return null;
  return (
    <Container3D rotation={[0, turn, 0]}>
      {bunnyNames.map((name, i) => {
        const a = (i / bunnyNames.length) * 2 * Math.PI;
        return (
          // A Sprite3D needs a transform at mount, else it draws 1×1 units.
          // pixelSize makes a bunny about one unit tall.
          <Sprite3D
            key={name}
            anchor={[0.5, 1]}
            billboardMode={billboardMode}
            pixelSize={1 / 32}
            position={[Math.cos(a) * 2, 0, Math.sin(a) * 2]}
            texture={textures[name]}
          />
        );
      })}
    </Container3D>
  );
}

export default function Sprite3DExample() {
  const { billboardMode } = useControls({
    billboardMode: { options: ["none", "spherical", "cylindrical"], value: "spherical" },
  });
  return (
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
      <View3D autoResize fog={fog}>
        <Camera3D position={start} />
        <OrbitCamera enableDamping maxDistance={15} maxPolarAngle={1.45} minDistance={3} target={target} />
        {/* The light is for the floor: a sprite draws its texture unlit. */}
        <DirectionalLight intensity={3} rotation={[-0.8, 0.4, 0]} />
        <Ring billboardMode={billboardMode as BillboardMode} />
        <Floor />
      </View3D>
    </Stage>
  );
}
