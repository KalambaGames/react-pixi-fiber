// Every filter and every parameter: https://pixijs.io/filters/examples/
import { useControls } from "leva";
import { BaseTexture, Point, SCALE_MODES, Spritesheet } from "pixi.js";
import { useState } from "react";
import { BlurFilter, Container, type InstanceOf, Sprite, Stage, Text } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

const centerAnchor = new Point(0.5, 0.5);
const scale = new Point(3, 3);
const sheet = new Spritesheet(BaseTexture.from(bunnys), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse();

const bunnyNames = ["bunny", "bunnyCute"] as const;
const textures = bunnyNames.map(name => sheet.textures[name]);

export default function UnmountExample() {
  const [filter, setFilter] = useState<InstanceOf<"BlurFilter"> | null>(null);
  const { container, secondBunny } = useControls({
    container: true,
    secondBunny: { label: "second bunny", value: true },
  });

  // react-pixi-fiber destroys a filter when its element unmounts, and when any ancestor of the element unmounts.
  // To filter several objects in one pass, put the filter on their parent: the one on this container filters both bunnies.
  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text={`${filter ? "filter alive" : "filter destroyed by react-pixi-fiber"}\nRemoving a bunny keeps the filter on the container.\nRemoving the container destroys it.`}
        x={10}
        y={8}
      />
      {container && (
        <Container>
          {/* React calls the ref callback with the filter on mount and with null when the filter element unmounts. */}
          <BlurFilter blur={2} ref={setFilter} />
          <Sprite anchor={centerAnchor} scale={scale} texture={textures[0]} x={130} y={170} />
          {secondBunny && <Sprite anchor={centerAnchor} scale={scale} texture={textures[1]} x={270} y={170} />}
        </Container>
      )}
    </Stage>
  );
}
