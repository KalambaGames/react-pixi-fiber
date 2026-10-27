import { useControls } from "leva";
import { Filter, Point, SCALE_MODES, settings, type Texture } from "pixi.js";
import { useMemo, useRef } from "react";
import { Container, PIXIFilter, Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

settings.SCALE_MODE = SCALE_MODES.NEAREST;

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
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

type WaveFilterInstance = Filter<{ amplitude: number; time: number }>;

// PixiJS 4 reads the uniforms from the shader source.
const WaveFilter = PIXIFilter<WaveFilterInstance, { amplitude?: number }>("WaveFilter", {
  applyProps: (filter, oldProps, newProps) => {
    if (newProps.amplitude !== undefined && newProps.amplitude !== oldProps?.amplitude) {
      filter.uniforms.amplitude = newProps.amplitude;
    }
  },
  create: () => new Filter<{ amplitude: number; time: number }>(undefined, fragment),
});

function Bunnies({ amplitude, textures }: { amplitude: number; textures: Texture[] }) {
  const wave = useRef<WaveFilterInstance>(null);

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
  const { textures: frames } = useSpritesheet(bunnys, bunnysData);
  const textures = useMemo(() => frames.bunny && bunnyNames.map(name => frames[name] as Texture), [frames]);
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
      {textures && <Bunnies amplitude={amplitude} textures={textures} />}
    </Stage>
  );
}
