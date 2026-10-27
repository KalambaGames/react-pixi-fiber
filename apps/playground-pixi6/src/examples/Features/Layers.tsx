// This is demo of pixi-display.js, https://github.com/gameofbombs/pixi-display
// Drag the rabbits to understand what's going on
// https://pixijs.io/examples/#/layers/zorder.js
import { Group, Layer as PixiLayer, Stage as LayersStage } from "@pixi/layers";
import * as PIXI from "pixi.js";
import React from "react";
import { Container, PIXIComponent, PIXIProperty, Sprite, Stage } from "react-pixi-fiber";
// Frame names and rectangles: see the Features / Spritesheet example.
import bunnysData from "./assets/bunnys.json";
import bunnys from "./assets/bunnys.png";

type RectProps = {
  fill: number;
  height: number;
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
    instance.beginFill(fill);
    instance.drawRect(x, y, width, height);
    instance.endFill();

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

  dragStart = (e: PIXI.InteractionEvent) => {
    this.draggedObject = this;
    const pointer = e.data.getLocalPosition(this.parent!);
    this.dragOffset.set(pointer.x - this.x, pointer.y - this.y);
    this.onDragStart?.(this);
  };

  dragEnd = () => {
    this.draggedObject = null;
    this.onDragEnd?.(this);
  };

  dragMove = (e: PIXI.InteractionEvent) => {
    if (this.draggedObject === null) {
      return;
    }
    const pointer = e.data.getLocalPosition(this.draggedObject.parent!);
    this.draggedObject.position.set(pointer.x - this.dragOffset.x, pointer.y - this.dragOffset.y);
    this.onDragMove?.(this);
  };
}

const DraggableContainer = PIXIComponent<DraggableContainerInstance, DraggableContainerProps>("DraggableContainer", {
  create: () => new DraggableContainerInstance(),
  afterAdd: instance => {
    instance.interactive = true;
    instance.cursor = "pointer";

    instance.on("mousedown", instance.dragStart);
    instance.on("mouseup", instance.dragEnd);
    instance.on("mouseupoutside", instance.dragEnd);
    // PixiJS 6 sends `mousemove` to every interactive object, also when the pointer is not over it, so a fast drag
    // keeps the container.
    instance.on("mousemove", instance.dragMove);
  },
  beforeRemove: instance => {
    instance.off("mousedown", instance.dragStart);
    instance.off("mouseup", instance.dragEnd);
    instance.off("mouseupoutside", instance.dragEnd);
    instance.off("mousemove", instance.dragMove);
  },
});

const centerAnchor = new PIXI.Point(0.5, 0.5);

const sheet = new PIXI.Spritesheet(PIXI.BaseTexture.from(bunnys), bunnysData);
// parse fills sheet.textures before it returns, for a sheet this small.
// The documented way waits for parse: see the Features / Spritesheet example.
sheet.parse();

const bunnyNames = ["bunny", "bunnyCute", "bunnySporty", "bunnyRobot", "bunnyAstronaut"] as const;
const textures = bunnyNames.map(name => sheet.textures[name]);

type BunnyProps = Omit<React.ComponentProps<typeof Sprite>, "texture"> & {
  // Component used to render the bunny, e.g. `Animated.Sprite`
  as?: React.ComponentType<any>;
  // Index of the bunny in the sprite sheet
  texture?: number;
};

function Bunny({ as: Component = Sprite, texture = 0, ...passedProps }: BunnyProps) {
  return <Component anchor={centerAnchor} {...passedProps} texture={textures[texture]} />;
}

type ColoredBunnyProps = React.ComponentProps<typeof Container> & {
  fill: number;
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

type LayerProps = {
  group: Group;
};

const Layer = PIXIComponent<PIXI.Container, LayerProps>("Layer", {
  create: ({ group }) => new PixiLayer(group),
});

// No custom props, the stage is always sortable
type LayeredStageProps = {};

type LayeredStageInstance = LayersStage & {
  _updateStageRafId: number;
};

const LayeredStage = PIXIComponent<LayeredStageInstance, LayeredStageProps>("LayeredStage", {
  create: () => {
    const stage = new LayersStage() as LayeredStageInstance;
    stage.sortableChildren = true;
    return stage;
  },
  afterAdd: instance => {
    const updateStage = () => {
      instance.updateStage();
      instance._updateStageRafId = window.requestAnimationFrame(updateStage);
    };
    updateStage();
  },
  beforeRemove: instance => {
    window.cancelAnimationFrame(instance._updateStageRafId);
    instance.destroy();
  },
});

const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 300,
  width: 400,
};

// Mark parentGroup prop as legal on Container as long as it's a valid display group
PIXIProperty(Container, "parentGroup", value => value instanceof Group);

//META STUFF, groups exist without stage just fine

// z-index = 0, sorting = true;
const greenGroup = new Group(0, true);

// green bunnies go down
greenGroup.on("sort", (bunny: PIXI.DisplayObject) => {
  // we are dragging bunny parent, not the bunny itself
  bunny.zOrder = bunny.parent.y;
});

// blue bunnies go up
// z-index = 1, sorting = true, we can provide zOrder function directly in constructor
const blueGroup = new Group(1, (bunny: PIXI.DisplayObject) => {
  // we are dragging bunny parent, not the bunny itself
  bunny.zOrder = -bunny.parent.y;
});

// Drag is the best layer, dragged element is above everything else
const dragGroup = new Group(2, false);

// Shadows are the lowest
const shadowGroup = new Group(-1, false);

const blurFilter = new PIXI.filters.BlurFilter();
blurFilter.blur = 0.5;
const shadowFilters = [blurFilter];

type BunnyWithGroup = PIXI.DisplayObject & { oldGroup?: Group };

const onBunnyDragEnd = (instance: DraggableContainerInstance) => {
  // we are dragging bunny parent, not the bunny itself
  const bunny = instance.children[1] as BunnyWithGroup;
  bunny.parentGroup = bunny.oldGroup;
};

const onBunnyDragStart = (instance: DraggableContainerInstance) => {
  // we are dragging bunny parent, not the bunny itself
  const bunny = instance.children[1] as BunnyWithGroup;
  bunny.oldGroup = bunny.parentGroup;
  bunny.parentGroup = dragGroup;
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

const stage = new LayersStage();
stage.group.enableSort = true;

function LayersExample() {
  return (
    <Stage options={OPTIONS}>
      {/* specify display list component */}
      <LayeredStage>
        {/* sorry, group cant exist without layer yet :( */}
        <Layer group={blueGroup} />
        <Layer group={greenGroup} />
        <Layer group={dragGroup} />
        {/* one blur for all shadows, a filter per shadow costs a render pass each */}
        <Layer filters={shadowFilters} group={shadowGroup} />
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
              <Rect {...shadowProps} parentGroup={shadowGroup} />
              <ColoredBunny fill={0x74fa9a} parentGroup={greenGroup} />
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
              <Rect {...shadowProps} parentGroup={shadowGroup} />
              <ColoredBunny fill={0x74fa9a} parentGroup={greenGroup} />
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
              <Rect {...shadowProps} parentGroup={shadowGroup} />
              <ColoredBunny fill={0xbcfdfe} parentGroup={blueGroup} />
            </DraggableContainer>
          ))}
        </Container>
      </LayeredStage>
    </Stage>
  );
}

export default LayersExample;
