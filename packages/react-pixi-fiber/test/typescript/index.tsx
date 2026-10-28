import "@react-pixi-fiber/pixi-6"; // loads the PixiInstances augmentation
import {
  type InteractionCompatibility,
  type InteractionEventCompatibility,
  type InteractiveComponent,
  type PixiTypeFallback,
  SimpleMesh,
  SimplePlane,
  SimpleRope,
  NineSlicePlane as Pixi6NineSlicePlane,
} from "@react-pixi-fiber/pixi-6";
import * as PIXI from "pixi.js";
import * as React from "react";
import type {
  InteractiveComponent as CoreInteractiveComponent,
  CustomDisplayObject,
  CustomDisplayObjectAttachHandler,
  CustomDisplayObjectCreator,
  CustomDisplayObjectDetachHandler,
  CustomDisplayObjectPropSetter,
  CustomDisplayObjectPropSetterContext,
  CustomPIXIComponentBehavior,
  CustomPIXIComponentBehaviorDefinition,
  CustomPIXIComponentProps,
} from "react-pixi-fiber";
import {
  AnimatedSprite,
  BitmapText,
  BlurFilter,
  Container,
  Graphics,
  MeshRope,
  NineSlicePlane,
  NineSliceSprite,
  ParticleContainer,
  Sprite,
  Stage,
  Text,
  TilingSprite,
  CustomPIXIComponent,
  CustomPIXIProperty,
  PIXIComponent,
  PIXIFilter,
  PIXIProperty,
  applyProps,
  getInstanceTag,
  createStageClass,
} from "react-pixi-fiber";

// @ts-expect-error x is a number on PixiJS 6; if this line is unused, the augmentation did not merge
const WrongProp = <Sprite x="1" />;
console.log(WrongProp);

// The 2.x compatibility types.
const interactionKey: InteractionCompatibility = "anything";
const interactionEventKey: InteractionEventCompatibility = "prototype";
const interactive: InteractiveComponent = { click: (event: PIXI.InteractionEvent) => console.log(event.data) };
const coreInteractive: CoreInteractiveComponent = interactive;
const fallback: PixiTypeFallback<PIXI.Sprite, number> = new PIXI.Sprite();
console.log(interactionKey, interactionEventKey, coreInteractive, fallback);

// The PixiJS 6 class names are components too.
const AliasExample: React.FC<{ texture: PIXI.Texture }> = ({ texture }) => (
  <>
    <Pixi6NineSlicePlane texture={texture} leftWidth={1} />
    <SimpleMesh texture={texture} uvs={new Float32Array([0, 0])} />
    <SimplePlane texture={texture} verticesX={2} />
    <SimpleRope texture={texture} points={[new PIXI.Point(0, 0)]} />
  </>
);
console.log(AliasExample);

const anchor = new PIXI.ObservablePoint(() => {}, undefined, 0.5, 0.5);

const texture = PIXI.Texture.from("https://i.imgur.com/IaUrttj.png");

const CompositionExample: React.FC = () => (
  <Container>
    <BitmapText text="" />
  </Container>
);

type CustomAnimatedSpriteProps = {
  textures: PIXI.AnimatedSprite["textures"];
};
const CustomAnimatedSprite = PIXIComponent<PIXI.AnimatedSprite, CustomAnimatedSpriteProps>("CustomAnimatedSprite", {
  create: props => new PIXI.AnimatedSprite(props.textures),
  applyProps: (instance, oldProps, newProps) => {
    console.log(instance.animationSpeed);
    console.log(instance.textures);
    console.log(oldProps?.textures);
    console.log(newProps.textures);
  },
  afterAdd: instance => {
    console.log(instance.textures);
  },
  beforeRemove: instance => {
    console.log(instance.textures);
  },
});

// The deprecated 2.x argument order and behavior keys still typecheck.

interface WickedContainerProps {
  isJungleMassive?: boolean;
  isWicked: boolean;
}

class WickedContainerClass extends PIXI.Container implements WickedContainerProps {
  isJungleMassive: boolean | undefined;
  isWicked: boolean;

  constructor(isWicked: boolean) {
    super();

    this.isWicked = isWicked;
  }
}

const WickedContainer = CustomPIXIComponent<WickedContainerClass, WickedContainerProps>(
  {
    customDisplayObject: props => {
      const instance = new WickedContainerClass(props.isWicked);

      if (props.isJungleMassive) {
        instance.isJungleMassive = props.isJungleMassive;
      }

      return instance;
    },
    customApplyProps: (instance, oldProps, newProps) => {
      console.log(instance.children);
      console.log(instance.isWicked);
      console.log(oldProps?.isJungleMassive);
    },
    customDidAttach: instance => {
      console.log(instance.isWicked);
    },
    customWillDetach: instance => {
      console.log(instance.isJungleMassive);
    },
  },
  "WickedContainer"
);

// The deprecated `Custom*` type names still typecheck a 2.x behavior.
const wickedCreate: CustomDisplayObjectCreator<WickedContainerClass, WickedContainerProps> = props =>
  new WickedContainerClass(props.isWicked);
const wickedApplyProps: CustomDisplayObjectPropSetter<WickedContainerClass, WickedContainerProps> = function (
  instance,
  oldProps,
  newProps
) {
  const context: CustomDisplayObjectPropSetterContext<WickedContainerClass, WickedContainerProps> = this;
  context.applyDisplayObjectProps(oldProps, newProps);
  console.log(instance.isWicked);
};
const wickedAttach: CustomDisplayObjectAttachHandler<WickedContainerClass> = instance => console.log(instance);
const wickedDetach: CustomDisplayObjectDetachHandler<WickedContainerClass> = instance => console.log(instance);
const wickedDefinition: CustomPIXIComponentBehaviorDefinition<WickedContainerClass, WickedContainerProps> = {
  customApplyProps: wickedApplyProps,
  customDidAttach: wickedAttach,
  customDisplayObject: wickedCreate,
  customWillDetach: wickedDetach,
};
const wickedBehavior: CustomPIXIComponentBehavior<WickedContainerClass, WickedContainerProps> = wickedDefinition;
const wickedInstance = null as unknown as CustomDisplayObject<WickedContainerClass, WickedContainerProps>;
const wickedProps: CustomPIXIComponentProps<WickedContainerClass, WickedContainerProps> = { isWicked: true };
console.log(wickedBehavior, wickedInstance, wickedProps);

type CircleProps = {
  fill: number;
  radius: number;
};
// `function` form of `customApplyProps` gets bound `this.applyDisplayObjectProps`.
const Circle = PIXIComponent<PIXI.Graphics, CircleProps>("Circle", {
  create: () => new PIXI.Graphics(),
  applyProps: function (instance, oldProps, newProps) {
    const { fill, radius, ...newPropsRest } = newProps;
    const { fill: oldFill, radius: oldRadius, ...oldPropsRest }: Partial<CircleProps> = oldProps ?? {};
    if (oldFill !== fill || oldRadius !== radius) {
      instance.clear();
      instance.beginFill(fill);
      instance.drawCircle(0, 0, radius);
      instance.endFill();
    }
    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

// A bare function is the `create` of a behavior.
const PlainGraphics = PIXIComponent("PlainGraphics", () => new PIXI.Graphics());

// A filter class registers with `PIXIFilter`: its fields and setters are props, Display Object props are not.
class GlowFilter extends PIXI.Filter {
  private _strength = 1;
  get strength(): number {
    return this._strength;
  }
  set strength(value: number) {
    this._strength = value;
  }
}
const Glow = PIXIFilter("Glow", () => new GlowFilter());
const glowRef = React.createRef<GlowFilter>();
const GlowExample = <Glow enabled ref={glowRef} strength={2} />;
// @ts-expect-error a filter has no `x`
const GlowWithX = <Glow x={1} />;
// @ts-expect-error a filter has no `visible`
const GlowWithVisible = <Glow visible />;
// @ts-expect-error a filter has no children
const GlowWithChildren = <Glow>{null}</Glow>;
console.log(GlowExample, GlowWithX, GlowWithVisible, GlowWithChildren);

// A built-in filter tag takes the props of its PixiJS class.
const SpriteWithBlur = (
  <Sprite>
    <BlurFilter blur={2} />
    <BlurFilter kernelSize={7} />
    {/* @ts-expect-error a filter has no `x` */}
    <BlurFilter x={1} />
  </Sprite>
);
console.log(SpriteWithBlur);

// Custom properties can be registered on one, many or all component types.
PIXIProperty(Sprite, "id", value => typeof value === "number");
PIXIProperty([Container, "Sprite"], "parentGroup");
PIXIProperty(undefined, "zOrder");
CustomPIXIProperty(null, "legacyZOrder");

// Re-apply props the way the component that created the instance does.
const reapply = (instance: PIXI.DisplayObject): string | undefined => {
  applyProps(instance, {}, { alpha: 1 });
  return getInstanceTag(instance);
};
console.log(reapply);

const CustomPIXIComponentExample: React.FC = () => (
  <>
    <CustomAnimatedSprite textures={[]} />
    <Circle fill={0xffff00} radius={10} position="10,10" />
    <PlainGraphics x={1} />
  </>
);

type WithRestProps<P, T> = P & Omit<T, keyof P>;
type RestPropsExampleProps = WithRestProps<
  {
    propertyNotInSpriteAlready: string;
    render: boolean;
  },
  Sprite
>;
const RestPropsExample: React.FC<RestPropsExampleProps> = ({
  render,
  propertyNotInSpriteAlready,
  ...rest
}: RestPropsExampleProps) => {
  console.log("propertyNotInSpriteAlready: ", propertyNotInSpriteAlready);
  return render ? <Sprite {...rest} /> : null;
};

const StageClassExample: React.FC = () => {
  const Stage = createStageClass();

  const stageRef = React.useRef<typeof Stage>(null);
  const spriteRef = React.useRef<PIXI.Sprite>(null);
  const wickedContainerRef = React.useRef<WickedContainerClass>(null);

  React.useEffect(() => {
    if (stageRef.current) {
      console.log("stageRef", stageRef.current._app.current?.renderer);
      console.log("stageRef", stageRef.current._canvas.current?.width);
      console.log("stageRef", stageRef.current.props);
    }

    if (spriteRef.current) {
      console.log("spriteRef", spriteRef.current.position);
      console.log("spriteRef", spriteRef.current.children);
    }

    if (wickedContainerRef.current) {
      console.log("wickedContainerRef", wickedContainerRef.current.children);
      console.log("wickedContainerRef", wickedContainerRef.current.isWicked);
      console.log("wickedContainerRef", wickedContainerRef.current.isJungleMassive);
    }
  }, []);

  return (
    <>
      <Stage key="stage1" ref={stageRef} options={{ backgroundColor: 0xffffff }} position="0,0" scale={1}>
        <BitmapText
          key="bitmapText1"
          text="Bitmap text 1"
          style={{ font: { name: "Font", size: 42 }, align: "left", tint: 0xffffff }}
        />
        <BitmapText
          key="bitmapText2"
          text="Bitmap text 2"
          font={{ name: "Font", size: 42 }}
          align="left"
          tint={0xffffff}
        />
        <Container position="10,10">
          <BitmapText text="" />
        </Container>
        {/* Point-like props accept a single value, a comma-separated string, a 1 or 2 element tuple, an object or a PIXI point. */}
        <Graphics position={1} />
        <Graphics position="1,2" />
        <Graphics position={[1]} />
        <Graphics position={[1, 2]} />
        <Graphics position={{ x: 1, y: 2 }} />
        <Graphics position={new PIXI.Point(1, 2)} />
        <NineSlicePlane texture={texture} leftWidth={10} bottomHeight={5} rightWidth={15} topHeight={0} />
        <ParticleContainer autoResize={false}>
          <Sprite texture={PIXI.Texture.WHITE} />
        </ParticleContainer>
      </Stage>
      <Stage
        key="stage2"
        ref={stage => {
          if (stage) {
            console.log("stage", stage._app);
            console.log("stage", stage._canvas);
            console.log("stage", stage.props);
          }
        }}
        options={{ backgroundColor: 0xffffff }}
        position="0,0"
        scale={1}
      >
        <Sprite anchor={anchor} texture={texture} ref={spriteRef} interactive pointerup={(): void => {}} />
        <Text text="Regular text" />
        <Text text="Styled text" style={{ fontSize: 12 }} />
        <Text text="Styled text" style={new PIXI.TextStyle({ fontSize: 12 })} />
        <TilingSprite texture={texture} />
        <AnimatedSprite textures={[]} />
        <MeshRope texture={texture} points={[]} />
        <NineSliceSprite texture={texture} leftWidth={1} topHeight={1} rightWidth={1} bottomHeight={1} />
        <CompositionExample />
        <CustomAnimatedSprite animationSpeed={2} textures={[]} position="0,10" />
        <WickedContainer isWicked={false} />
        <WickedContainer isWicked={true} isJungleMassive={true} ref={wickedContainerRef} />
        <RestPropsExample propertyNotInSpriteAlready="2" render anchor="0.5,0.5" />
      </Stage>
    </>
  );
};

const StageFunctionExample: React.FC = () => {
  const stageRef = React.useRef<typeof Stage>(null);
  const spriteRef = React.useRef<PIXI.Sprite>(null);
  const wickedContainerRef = React.useRef<WickedContainerClass>(null);

  React.useEffect(() => {
    if (stageRef.current) {
      console.log("stageRef", stageRef.current._app.current?.renderer);
      console.log("stageRef", stageRef.current._canvas.current?.width);
      console.log("stageRef", stageRef.current.props);
    }

    if (spriteRef.current) {
      console.log("spriteRef", spriteRef.current.position);
      console.log("spriteRef", spriteRef.current.children);
    }

    if (wickedContainerRef.current) {
      console.log("wickedContainerRef", wickedContainerRef.current.children);
      console.log("wickedContainerRef", wickedContainerRef.current.isWicked);
      console.log("wickedContainerRef", wickedContainerRef.current.isJungleMassive);
    }
  }, []);

  return (
    <>
      <Stage key="stage1" ref={stageRef} options={{ backgroundColor: 0xffffff }} position="0,0" scale={1}>
        <BitmapText
          key="bitmapText1"
          text="Bitmap text 1"
          style={{ font: { name: "Font", size: 42 }, align: "left", tint: 0xffffff }}
        />
        <BitmapText
          key="bitmapText2"
          text="Bitmap text 2"
          font={{ name: "Font", size: 42 }}
          align="left"
          tint={0xffffff}
        />
        <Container position="10,10">
          <BitmapText text="" />
        </Container>
        {/* Point-like props accept a single value, a comma-separated string, a 1 or 2 element tuple, an object or a PIXI point. */}
        <Graphics position={1} />
        <Graphics position="1,2" />
        <Graphics position={[1]} />
        <Graphics position={[1, 2]} />
        <Graphics position={{ x: 1, y: 2 }} />
        <Graphics position={new PIXI.Point(1, 2)} />
        <NineSlicePlane texture={texture} leftWidth={10} bottomHeight={5} rightWidth={15} topHeight={0} />
        <ParticleContainer autoResize={false}>
          <Sprite texture={PIXI.Texture.WHITE} />
        </ParticleContainer>
      </Stage>
      <Stage
        key="stage2"
        ref={stage => {
          if (stage) {
            console.log("stage", stage._app);
            console.log("stage", stage._canvas);
            console.log("stage", stage.props);
          }
        }}
        options={{ backgroundColor: 0xffffff }}
        position="0,0"
        scale={1}
      >
        <Sprite anchor={anchor} texture={texture} ref={spriteRef} interactive pointerup={(): void => {}} />
        {/* Every wrapped Display Object is a Container, so leaf components accept children. */}
        <Sprite texture={texture}>
          {/* Callback ref parameter is the `PIXI.Sprite` instance, not the props type. */}
          <Sprite texture={texture} ref={sprite => sprite?.position.set(0, 0)} />
        </Sprite>
        <Text text="Regular text" />
        <Text text="Styled text" style={{ fontSize: 12 }} />
        <Text text="Styled text" style={new PIXI.TextStyle({ fontSize: 12 })} />
        <TilingSprite texture={texture} />
        <CompositionExample />
        <CustomAnimatedSprite animationSpeed={2} textures={[]} position="0,10" />
        <WickedContainer isWicked={false} />
        <WickedContainer isWicked={true} isJungleMassive={true} ref={wickedContainerRef} />
        <RestPropsExample propertyNotInSpriteAlready="2" render anchor="0.5,0.5" />
      </Stage>
    </>
  );
};

// `Stage` is a value and a type, as in 2.x (a consumer does `useRef<Stage | null>(null)`).
const StageAsTypeExample: React.FC = () => {
  const stageRef = React.useRef<Stage | null>(null);
  return <Stage ref={stageRef} options={{}} />;
};

const OnInitExample: React.FC = () => (
  <Stage options={{ width: 1, height: 1 }} onInit={app => console.log(app.stage)} />
);

const TitleContext = React.createContext<{ title: string }>({ title: "" });
const StageWithBridgedContextsExample: React.FC = () => <Stage bridgeContexts={[TitleContext]} options={{}} />;

const app = new PIXI.Application();
const StageWithAppExample: React.FC = () => <Stage app={app} />;
// @ts-expect-error `app` and `options` are exclusive
const StageWithAppAndOptionsExample: React.FC = () => <Stage app={app} options={{ width: 1 }} />;
const StageWithDestroyOptionsExample: React.FC = () => <Stage destroyOptions={{ children: true }} options={{}} />;
// @ts-expect-error `app` and `destroyOptions` are exclusive
const StageWithAppAndDestroyOptionsExample: React.FC = () => <Stage app={app} destroyOptions={false} />;
// @ts-expect-error `context` is a PixiJS 8 destroy option
const StageWithPixi8DestroyOptionsExample: React.FC = () => <Stage destroyOptions={{ context: true }} options={{}} />;
