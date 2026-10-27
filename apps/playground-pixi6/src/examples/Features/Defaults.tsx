import { useState } from "react";
import { Sprite, Stage, Text } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

// This runner configures the adapter with default props per tag, see the setup panel:
// pixi6({ defaults: { Sprite: { anchor: 0.5 }, Text: { style: { fill: "white", fontSize: 24 } } } })
// A prop that is missing when the instance is created gets its default.
// A prop that is removed later returns to its default.
// A default replaces the whole prop. A `style` object does not merge with the default `style`.

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

function DefaultsExample() {
  const [overridden, setOverridden] = useState(false);
  const { textures } = useSpritesheet(bunnys, bunnysData);
  if (!textures.bunny) return null;

  return (
    <Stage options={OPTIONS}>
      {/* Its own `style` replaces the whole default `style`. It sets no `fill`, so the text is black, not white. */}
      <Text
        cursor="pointer"
        interactive
        pointerdown={() => setOverridden(overridden => !overridden)}
        style={{ fontSize: 16 }}
        text="Tap here to toggle the anchor of the right bunny"
        x={10}
        y={10}
      />
      {/* No `anchor` prop: the default 0.5 centers the bunny on x, y. */}
      <Sprite texture={textures.bunny} x={100} y={120} />
      {/* `anchor` 0 puts the top-left corner on x, y. Removing the prop restores the default 0.5. */}
      <Sprite anchor={overridden ? 0 : undefined} texture={textures.bunny} x={300} y={120} />
      {/* No `style` prop: the labels are white and 24px from the default. */}
      <Text text="no anchor" x={50} y={170} />
      <Text text={overridden ? "anchor 0" : "no anchor"} x={250} y={170} />
    </Stage>
  );
}

export default DefaultsExample;
