import {
  Container,
  CustomPIXIComponent,
  CustomPIXIProperty,
  NineSlicePlane,
  Sprite,
  createStageClass,
} from "react-pixi-fiber";
import * as PIXI from "pixi.js";
import bunnys from "./assets/bunnys.png";

type LegacyRectProps = {
  fill: number;
  size: number;
  x: number;
  y: number;
};

const LegacyRect = CustomPIXIComponent<PIXI.Graphics, LegacyRectProps>(
  {
    customApplyProps: function (instance, oldProps, newProps) {
      const { fill, size, ...rest } = newProps;
      instance.clear();
      instance.beginFill(fill);
      instance.drawRect(0, 0, size, size);
      instance.endFill();
      this.applyDisplayObjectProps(oldProps || {}, rest);
    },
    customDidAttach: instance => {
      instance.alpha = 0.8;
    },
    customDisplayObject: () => new PIXI.Graphics(),
    customWillDetach: instance => {
      instance.clear();
    },
  },
  "DeprecatedRect"
);

CustomPIXIProperty(Sprite, "label", value => typeof value === "string");

const LegacyStage = createStageClass();

const texture = PIXI.Texture.from(bunnys);
const OPTIONS = { backgroundColor: 0x1099bb, height: 300, width: 400 };

function DeprecationsExample() {
  return (
    <div>
      <p>This page exercises deprecated APIs: expect deprecation warnings in the console.</p>
      <LegacyStage height={300} options={OPTIONS} width={400}>
        <Container>
          <LegacyRect fill={0xffcc00} size={80} x={20} y={20} />
          <NineSlicePlane
            bottomHeight={10}
            height={100}
            leftWidth={10}
            rightWidth={10}
            texture={texture}
            topHeight={10}
            width={200}
            x={150}
            y={20}
          />
          <Sprite {...{ label: "bunny" }} texture={texture} x={20} y={150} />
        </Container>
      </LegacyStage>
    </div>
  );
}

export default DeprecationsExample;
