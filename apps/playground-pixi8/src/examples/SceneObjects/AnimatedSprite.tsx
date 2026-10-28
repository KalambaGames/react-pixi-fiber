import { type Texture } from "pixi.js";
import { Fragment, useMemo, useState } from "react";
import { AnimatedSprite, Stage } from "react-pixi-fiber";
// useSpritesheet source, frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";
import { useSpritesheet } from "./hooks/useSpritesheet";

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

export default function AnimatedSpriteExample() {
  const { textures: frames } = useSpritesheet(bunnys, bunnysData);
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [reversed, setReversed] = useState(false);
  // A new `textures` array starts the animation again at frame 0. A sprite that plays keeps playing.
  const textures = useMemo(() => {
    if (!frames.bunny) return undefined;
    const list = bunnyNames.map(name => frames[name] as Texture);
    return reversed ? list.reverse() : list;
  }, [frames, reversed]);
  return (
    <Fragment>
      <table style={{ margin: "0 auto 1.5em", textAlign: "left" }}>
        <tbody>
          <tr>
            <td>Loop: {loop ? "yes" : "no"}</td>
            <td>
              <input checked={loop} onChange={event => setLoop(event.target.checked)} type="checkbox" />
            </td>
          </tr>
          <tr>
            <td>Playing: {playing ? "yes" : "no"}</td>
            <td>
              <button onClick={() => setPlaying(playing => !playing)}>toggle playing</button>
            </td>
          </tr>
          <tr>
            <td>Textures: {reversed ? "reversed" : "in order"}</td>
            <td>
              <button onClick={() => setReversed(reversed => !reversed)}>swap textures</button>
            </td>
          </tr>
        </tbody>
      </table>
      <Stage options={{ background: 0x1099bb, height: 300, width: 400 }}>
        {textures && (
          <AnimatedSprite
            anchor={{ x: 0.5, y: 1 }}
            animationSpeed={0.1}
            loop={loop}
            // Without `loop`, the sprite stops at the end. Then the next click plays it again.
            onComplete={() => setPlaying(false)}
            playing={playing}
            scale={4}
            textures={textures}
            x={200}
            y={224}
          />
        )}
      </Stage>
    </Fragment>
  );
}
