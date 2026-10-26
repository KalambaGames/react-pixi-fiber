// Every filter and every parameter: https://pixijs.io/filters/examples/
import { useControls } from "leva";
import { Point, Rectangle, SCALE_MODES, settings, Texture } from "pixi.js";
import { useState } from "react";
import { BlurFilter, Container, type InstanceOf, Sprite, Stage, Text } from "react-pixi-fiber";
import bunnys from "./assets/bunnys.png";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const centerAnchor = new Point(0.5, 0.5);
const scale = new Point(3, 3);
const bunnyTextures = Texture.from(bunnys);
const textures = [
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 47, 26, 37)),
  new Texture(bunnyTextures.baseTexture, new Rectangle(2, 86, 26, 37)),
];

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
