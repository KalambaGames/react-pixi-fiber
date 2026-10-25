import { AtlasAttachmentLoader, SkeletonJson } from "@pixi-spine/runtime-4.1";
import { type ISkeletonData, Spine as PixiSpine, TextureAtlas } from "pixi-spine";
import { BaseTexture, Point } from "pixi.js";
import { useRef } from "react";
import { PIXIComponent, Stage, Text } from "react-pixi-fiber";
import atlasText from "./assets/spineboy.atlas?raw";
import skeletonJson from "./assets/spineboy.json?raw";
import spineboyPng from "./assets/spineboy.png";

const centerAnchor = new Point(0.5, 0.5);

// The skeleton and the atlas come with the example code. Only the atlas page loads as a texture.
const atlas = new TextureAtlas(atlasText, (_, loaded) => loaded(BaseTexture.from(spineboyPng)));
// pixi-spine 4 types the skeleton name as a string, and runtime 4.1 also allows null.
const skeletonData = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(skeletonJson) as ISkeletonData;

type SpineboyProps = { skeletonData: ISkeletonData };

// The skeleton starts idle. A mix of 0.2 s blends one animation into the next.
const Spineboy = PIXIComponent<PixiSpine, SpineboyProps>("Spineboy", {
  create: ({ skeletonData }) => {
    const spineboy = new PixiSpine(skeletonData);
    spineboy.state.data.defaultMix = 0.2;
    spineboy.state.setAnimation(0, "idle", true);
    return spineboy;
  },
  applyProps: function (instance, oldProps, newProps) {
    const { skeletonData, ...newPropsRest } = newProps;
    const { skeletonData: oldSkeletonData, ...oldPropsRest }: Partial<SpineboyProps> = oldProps || {};
    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

export default function SpineExample() {
  const spineboy = useRef<PixiSpine>(null);
  // The animation that loops on track 0. Jump plays once and then goes back to it.
  const loop = useRef("idle");

  const play = (name: string) => {
    loop.current = name;
    spineboy.current?.state.setAnimation(0, name, true);
  };
  const jump = () => {
    spineboy.current?.state.setAnimation(0, "jump", false);
    spineboy.current?.state.addAnimation(0, loop.current, true, 0);
  };
  // Shoot plays on track 1, over the legs of track 0, and then fades out.
  const shoot = () => {
    spineboy.current?.state.setAnimation(1, "shoot", false);
    spineboy.current?.state.addEmptyAnimation(1, 0.2, 0);
  };

  return (
    <div>
      <div style={{ alignItems: "center", display: "flex", gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={() => play("idle")}>
          Idle
        </button>
        <button type="button" onClick={() => play("walk")}>
          Walk
        </button>
        <button type="button" onClick={() => play("run")}>
          Run
        </button>
        <button type="button" onClick={jump}>
          Jump
        </button>
        <button type="button" onClick={shoot}>
          Shoot
        </button>
        <label>
          <input
            defaultChecked
            onChange={event => {
              if (spineboy.current) spineboy.current.state.data.defaultMix = event.target.checked ? 0.2 : 0;
            }}
            type="checkbox"
          />
          Mix
        </label>
      </div>
      <Stage options={{ backgroundColor: 0x1099bb, height: 300, width: 400 }}>
        <Spineboy
          ref={spineboy}
          // The jump lifts the hips about one body height, so the skeleton is small enough to stay on the canvas.
          scale={0.18}
          skeletonData={skeletonData}
          x={200}
          y={290}
        />
        <Text
          anchor={centerAnchor}
          style={{ fill: "white", fontFamily: "Arial", fontSize: 12 }}
          text="Spineboy by Esoteric Software (Spine Runtimes License)"
          x={200}
          y={14}
        />
      </Stage>
    </div>
  );
}
