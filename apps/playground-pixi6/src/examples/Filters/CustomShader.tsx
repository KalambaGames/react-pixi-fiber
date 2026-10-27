import { useControls } from "leva";
import { BaseTexture, Filter, Point, SCALE_MODES, settings, Spritesheet } from "pixi.js";
import { useRef } from "react";
import { Container, PIXIFilter, Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const sheet = new Spritesheet(BaseTexture.from(bunnys), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse();

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
const textures = bunnyNames.map(name => sheet.textures[name]);
const scale = new Point(2, 2);

// Moves each row of pixels sideways by a sine of its height and the time, as far as the amplitude.
const fragment = `
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float amplitude;
uniform float time;

void main(void) {
  vec2 coord = vTextureCoord;
  coord.x += sin(coord.y * 40.0 + time) * amplitude;
  gl_FragColor = texture2D(uSampler, coord);
}
`;

const WaveFilter = PIXIFilter<Filter, { amplitude?: number }>("WaveFilter", {
  applyProps: (filter, oldProps, newProps) => {
    if (newProps.amplitude !== undefined && newProps.amplitude !== oldProps?.amplitude) {
      filter.uniforms.amplitude = newProps.amplitude;
    }
  },
  create: () => new Filter(undefined, fragment, { amplitude: 0.005, time: 0 }),
});

function Bunnies({ amplitude }: { amplitude: number }) {
  const wave = useRef<Filter>(null);

  // The ticker writes the time uniform on the filter itself, so the wave moves without a React render.
  usePixiTicker(() => {
    if (wave.current) wave.current.uniforms.time += 0.1;
  });

  return (
    <Container>
      <WaveFilter amplitude={amplitude} ref={wave} />
      {textures.map((texture, index) => (
        <Sprite key={index} scale={scale} texture={texture} x={40 + index * 70} y={120} />
      ))}
    </Container>
  );
}

export default function CustomShaderExample() {
  const { amplitude } = useControls({
    amplitude: { max: 0.03, min: 0, pad: 3, step: 0.001, value: 0.005 },
  });

  return (
    <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }}
        text="A Filter from pixi.js with its own fragment shader"
        x={10}
        y={8}
      />
      <Bunnies amplitude={amplitude} />
    </Stage>
  );
}
