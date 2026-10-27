import { useControls } from "leva";
import { Filter, Point, type Texture, TextureSource } from "pixi.js";
import { useMemo, useRef } from "react";
import { Container, PIXIFilter, Sprite, Stage, Text, usePixiTicker } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

TextureSource.defaultOptions.scaleMode = "nearest";

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

const scale = new Point(2, 2);

// The default filter vertex shader of PixiJS 8.
const vertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  gl_Position = vec4(position, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}
`;

// Moves each row of pixels sideways by a sine of its height and the time, as far as the amplitude.
const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uAmplitude;
uniform float uTime;

void main(void) {
  vec2 coord = vTextureCoord;
  coord.x += sin(coord.y * 40.0 + uTime) * uAmplitude;
  finalColor = texture(uTexture, coord);
}
`;

// The filter has only a WebGL program, so it does not render with the WebGPU renderer.
const WaveFilter = PIXIFilter<Filter, { amplitude?: number }>("WaveFilter", {
  applyProps: (filter, oldProps, newProps) => {
    if (newProps.amplitude !== undefined && newProps.amplitude !== oldProps?.amplitude) {
      filter.resources.waveUniforms.uniforms.uAmplitude = newProps.amplitude;
    }
  },
  create: () =>
    Filter.from({
      gl: { fragment, vertex },
      resources: {
        waveUniforms: { uAmplitude: { type: "f32", value: 0.005 }, uTime: { type: "f32", value: 0 } },
      },
    }),
});

function Bunnies({ amplitude, textures }: { amplitude: number; textures: Texture[] }) {
  const wave = useRef<Filter>(null);

  // The ticker writes the time uniform on the filter itself, so the wave moves without a React render.
  usePixiTicker(() => {
    if (wave.current) wave.current.resources.waveUniforms.uniforms.uTime += 0.1;
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
    <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
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
