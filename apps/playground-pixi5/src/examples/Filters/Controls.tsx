// Every filter and every parameter: https://pixijs.io/filters/examples/
import { useControls } from "leva";
import { AdjustmentFilter as PixiAdjustmentFilter, type AdjustmentOptions } from "pixi-filters";
import { BaseTexture, Point, SCALE_MODES, settings, Spritesheet } from "pixi.js";
import { useRef } from "react";
import { Container, PIXIFilter, Sprite, Stage, Text } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const AdjustmentFilter = PIXIFilter("AdjustmentFilter", (props: AdjustmentOptions) => new PixiAdjustmentFilter(props));

const sheet = new Spritesheet(BaseTexture.from(bunnys), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse(() => {});

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
const textures = bunnyNames.map(name => sheet.textures[name]);
const scale = new Point(2, 2);

export default function ControlsExample() {
  // Counts the renders of this component, to show which controls re-render it.
  const renders = useRef(0);
  renders.current += 1;
  const adjustment = useRef<PixiAdjustmentFilter>(null);

  // useControls returns values, so a change of contrast or saturation re-renders the component.
  const { contrast, saturation } = useControls({
    contrast: { max: 2, min: 0, step: 0.05, value: 1 },
    saturation: { max: 2, min: 0, step: 0.05, value: 1 },
  });

  // A control with onChange is transient: it writes to the filter and does not re-render. A ref keeps the last value,
  // so a filter created after a change starts from it.
  const lastBrightness = useRef(1);
  useControls({
    brightness: {
      max: 2,
      min: 0,
      onChange: (value: number) => {
        lastBrightness.current = value;
        if (adjustment.current) adjustment.current.brightness = value;
      },
      step: 0.05,
      value: 1,
    },
  });

  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text={`React renders: ${renders.current}\ncontrast and saturation re-render, brightness does not`}
        x={10}
        y={8}
      />
      <Container>
        <AdjustmentFilter
          brightness={lastBrightness.current}
          contrast={contrast}
          ref={adjustment}
          saturation={saturation}
        />
        {textures.map((texture, index) => (
          <Sprite key={index} scale={scale} texture={texture} x={40 + index * 70} y={130} />
        ))}
      </Container>
    </Stage>
  );
}
