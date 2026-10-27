// This is a port of the pixi-display.js demo, https://github.com/gameofbombs/pixi-display, onto the PixiJS 8 RenderLayer
// Drag the rabbits to understand what's going on
// https://pixijs.io/examples/#/layers/zorder.js
import { RenderLayer } from "@react-pixi-fiber/pixi-8";
import * as PIXI from "pixi.js";
import { Assets, Point, Spritesheet, Texture } from "pixi.js";
import {
  type ComponentProps,
  type ComponentType,
  createContext,
  createRef,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Container, PIXIComponent, PIXIProperty, Sprite, Stage } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

const bunnySheet = Assets.load<Texture>(bunnys).then(async texture => {
  const sheet = new Spritesheet(texture, bunnysData);
  await sheet.parse();
  return sheet;
});

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;

const centerAnchor = new Point(0.5, 0.5);

// PixiJS 8 loads the sprite sheet asynchronously, so the bunnies render once their textures exist.
const BunnyTextures = createContext<Texture[]>([]);

function BunnyTexturesProvider({ children }: { children: ReactNode }) {
  const [textures, setTextures] = useState<Texture[]>();
  useEffect(() => {
    let cancelled = false;
    bunnySheet.then(sheet => {
      if (cancelled) return;
      setTextures(bunnyNames.map(name => sheet.textures[name]));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return textures ? <BunnyTextures.Provider value={textures}>{children}</BunnyTextures.Provider> : null;
}

type BunnyProps = Omit<ComponentProps<typeof Sprite>, "texture"> & {
  // Component used to render the bunny, e.g. `Animated.Sprite`
  as?: ComponentType<any>;
  // Index of the bunny in the sprite sheet
  texture?: number;
};

function Bunny({ as: Component = Sprite, texture = 0, ...passedProps }: BunnyProps) {
  const textures = useContext(BunnyTextures);
  return <Component anchor={centerAnchor} {...passedProps} texture={textures[texture]} />;
}

type RectProps = {
  fill: number;
  height: number;
  parentLayer?: LayerRef;
  width: number;
  x: number;
  y: number;
};

const Rect = PIXIComponent<PIXI.Graphics, RectProps>("Rect", {
  create: () => new PIXI.Graphics(),
  applyProps: function (instance, oldProps, newProps) {
    const { fill, x, y, width, height, ...newPropsRest } = newProps;
    const {
      fill: oldFill,
      x: oldX,
      y: oldY,
      width: oldWidth,
      height: oldHeight,
      ...oldPropsRest
    }: Partial<RectProps> = oldProps || {};
    if (typeof oldProps !== "undefined") {
      instance.clear();
    }
    // PixiJS 8 draws the shape first and fills it after.
    instance.rect(x, y, width, height).fill(fill);

    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

type DragHandler = (instance: DraggableContainerInstance) => void;

type DraggableContainerProps = {
  onDragEnd?: DragHandler;
  onDragMove?: DragHandler;
  onDragStart?: DragHandler;
};

// Drag handlers passed as props are set on the instance by react-pixi-fiber,
// listeners are stored on the instance so `beforeRemove` can remove them.
class DraggableContainerInstance extends PIXI.Container implements DraggableContainerProps {
  onDragEnd?: DragHandler;
  onDragMove?: DragHandler;
  onDragStart?: DragHandler;

  private draggedObject: DraggableContainerInstance | null = null;
  private dragOffset = new PIXI.Point();

  dragStart = (e: PIXI.FederatedPointerEvent) => {
    this.draggedObject = this;
    const pointer = e.getLocalPosition(this.parent!);
    this.dragOffset.set(pointer.x - this.x, pointer.y - this.y);
    this.onDragStart?.(this);
  };

  dragEnd = () => {
    this.draggedObject = null;
    this.onDragEnd?.(this);
  };

  dragMove = (e: PIXI.FederatedPointerEvent) => {
    if (this.draggedObject === null) {
      return;
    }
    // PixiJS reports a container twice to global move listeners while the pointer is over one of its children, so
    // adding `movementX` and `movementY` would move it twice as far. The container follows the pointer instead.
    const pointer = e.getLocalPosition(this.draggedObject.parent!);
    this.draggedObject.position.set(pointer.x - this.dragOffset.x, pointer.y - this.dragOffset.y);
    this.onDragMove?.(this);
  };
}

const DraggableContainer = PIXIComponent<DraggableContainerInstance, DraggableContainerProps>("DraggableContainer", {
  create: () => new DraggableContainerInstance(),
  afterAdd: instance => {
    instance.eventMode = "static";
    instance.cursor = "pointer";

    instance.on("mousedown", instance.dragStart);
    instance.on("mouseup", instance.dragEnd);
    instance.on("mouseupoutside", instance.dragEnd);
    // `mousemove` fires only while the pointer is over the container, so a fast drag would lose it.
    instance.on("globalmousemove", instance.dragMove);
  },
  beforeRemove: instance => {
    instance.off("mousedown", instance.dragStart);
    instance.off("mouseup", instance.dragEnd);
    instance.off("mouseupoutside", instance.dragEnd);
    instance.off("globalmousemove", instance.dragMove);
  },
});

type ColoredBunnyProps = ComponentProps<typeof Container> & {
  fill: number;
  parentLayer: LayerRef;
};

function ColoredBunny({ fill, ...rest }: ColoredBunnyProps) {
  return (
    <Container {...rest}>
      <Rect fill={0x0} height={42} width={42} x={-21} y={-21} />
      <Rect fill={fill} height={40} width={40} x={-20} y={-20} />
      <Bunny />
    </Container>
  );
}

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

// A RenderLayer draws the objects attached to it, wherever they are in the tree.
// The `parentLayer` prop attaches an object to a layer.
type LayerRef = RefObject<PIXI.RenderLayer | null>;

// The prop is stored per object and the object is attached again whenever it is added to a parent, because
// react-pixi-fiber moves children by removing and adding them and PixiJS 8 detaches a removed child from its layer.
const layerOf = new WeakMap<PIXI.Container, LayerRef>();
function attachToLayer(this: PIXI.Container) {
  layerOf.get(this)?.current?.attach(this);
}
Object.defineProperty(PIXI.Container.prototype, "parentLayer", {
  configurable: true,
  get(this: PIXI.Container) {
    return layerOf.get(this);
  },
  set(this: PIXI.Container, layer?: LayerRef | null) {
    this.off("added", attachToLayer);
    if (layer) {
      layerOf.set(this, layer);
      this.on("added", attachToLayer);
      layer.current?.attach(this);
    } else {
      layerOf.delete(this);
      this.parentRenderLayer?.detach(this);
    }
  },
});

// Mark parentLayer prop as legal on Container as long as it's a mounted render layer
PIXIProperty(Container, "parentLayer", value => (value as LayerRef | undefined)?.current instanceof PIXI.RenderLayer);

// green bunnies go down
const greenLayer: LayerRef = createRef();
const sortGreen = (a: PIXI.Container, b: PIXI.Container) =>
  // we are dragging bunny parent, not the bunny itself
  (a.parent?.y ?? 0) - (b.parent?.y ?? 0);

// blue bunnies go up
const blueLayer: LayerRef = createRef();
const sortBlue = (a: PIXI.Container, b: PIXI.Container) =>
  // we are dragging bunny parent, not the bunny itself
  (b.parent?.y ?? 0) - (a.parent?.y ?? 0);

// Drag is the best layer, dragged element is above everything else
const dragLayer: LayerRef = createRef();

// Shadows are the lowest
const shadowLayer: LayerRef = createRef();

const blurFilter = new PIXI.BlurFilter();
// PixiJS 8 calls the blur amount `strength`.
blurFilter.strength = 0.5;
const shadowFilters = [blurFilter];

type BunnyWithLayer = PIXI.Container & { oldLayer?: PIXI.RenderLayer | null };

const onBunnyDragEnd = (instance: DraggableContainerInstance) => {
  // we are dragging bunny parent, not the bunny itself
  const bunny = instance.children[1] as BunnyWithLayer;
  bunny.oldLayer?.attach(bunny);
};

const onBunnyDragStart = (instance: DraggableContainerInstance) => {
  // we are dragging bunny parent, not the bunny itself
  const bunny = instance.children[1] as BunnyWithLayer;
  bunny.oldLayer = bunny.parentRenderLayer;
  dragLayer.current?.attach(bunny);
};

const blueBunnies = Array(6)
  .fill(0)
  .map((i, index) => index);
const greenBunnies = Array(8)
  .fill(0)
  .map((i, index) => index);
const evenBunnies = greenBunnies.filter(index => index % 2 === 0);
const oddBunnies = greenBunnies.filter(index => index % 2 !== 0);

const shadowProps = {
  fill: 0x0,
  height: 44,
  width: 44,
  x: -22,
  y: -22,
};

// The layers sort by zIndex. The bunnies attach to the layers in a second commit, after the layers are mounted.
function LayeredStage() {
  const [layersMounted, setLayersMounted] = useState(false);
  useLayoutEffect(() => setLayersMounted(true), []);

  return (
    <Container sortableChildren>
      <RenderLayer ref={blueLayer} sortableChildren sortFunction={sortBlue} zIndex={1} />
      <RenderLayer ref={greenLayer} sortableChildren sortFunction={sortGreen} zIndex={0} />
      <RenderLayer ref={dragLayer} zIndex={2} />
      {/* one blur for all shadows, a filter per shadow costs a render pass each */}
      <RenderLayer filters={shadowFilters} ref={shadowLayer} zIndex={-1} />
      {layersMounted && (
        <>
          {/* make obsolete containers. Why do we need them?
           * Just to show that we can do everything without
           * caring of actual parent container */}
          <Container>
            {evenBunnies.map(index => (
              <DraggableContainer
                key={index}
                onDragEnd={onBunnyDragEnd}
                onDragStart={onBunnyDragStart}
                x={50 + 20 * index}
                y={50 + 20 * index}
              >
                <Rect {...shadowProps} parentLayer={shadowLayer} />
                <ColoredBunny fill={0x74fa9a} parentLayer={greenLayer} />
              </DraggableContainer>
            ))}
          </Container>
          <Container>
            {oddBunnies.map(index => (
              <DraggableContainer
                key={index}
                onDragEnd={onBunnyDragEnd}
                onDragStart={onBunnyDragStart}
                x={50 + 20 * index}
                y={50 + 20 * index}
              >
                <Rect {...shadowProps} parentLayer={shadowLayer} />
                <ColoredBunny fill={0x74fa9a} parentLayer={greenLayer} />
              </DraggableContainer>
            ))}
          </Container>
          <Container>
            {blueBunnies.map(index => (
              <DraggableContainer
                key={index}
                onDragEnd={onBunnyDragEnd}
                onDragStart={onBunnyDragStart}
                x={210 + 20 * index}
                y={210 - 20 * index}
              >
                <Rect {...shadowProps} parentLayer={shadowLayer} />
                <ColoredBunny fill={0xbcfdfe} parentLayer={blueLayer} />
              </DraggableContainer>
            ))}
          </Container>
        </>
      )}
    </Container>
  );
}

function LayersExample() {
  return (
    <Stage options={OPTIONS}>
      <BunnyTexturesProvider>
        <LayeredStage />
      </BunnyTexturesProvider>
    </Stage>
  );
}

export default LayersExample;
