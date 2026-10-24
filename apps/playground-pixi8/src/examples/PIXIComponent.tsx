import * as PIXI from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { PIXIComponent, Stage, Text } from "react-pixi-fiber";

type CircleProps = {
  fill: number;
  radius: number;
  x: number;
  y: number;
};

const Circle = PIXIComponent<PIXI.Graphics, CircleProps>("Circle", {
  create: () => new PIXI.Graphics(),
  applyProps: function (instance, oldProps, newProps) {
    const { fill, x, y, radius, ...newPropsRest } = newProps;
    const { fill: oldFill, radius: oldRadius, ...oldPropsRest }: Partial<CircleProps> = oldProps || {};
    if (typeof oldProps !== "undefined") {
      instance.clear();
    }
    // PixiJS 8 draws the shape first and fills it after.
    instance.circle(x, y, radius).fill(fill);

    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

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

// See: https://github.com/juliencrn/usehooks.ts/blob/3beb733044ed40994725cf891a10ebfcd3569795/src/hooks/useInterval/useInterval.ts
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no delay is specified.
    if (delay === null) {
      return;
    }

    const id = setInterval(() => savedCallback.current(), delay);

    return () => clearInterval(id);
  }, [delay]);
}

const COLORS = [0xff00ff, 0x00ffff];
const POSITIONS = [
  { x: 300, y: 200 },
  { x: 400, y: 200 },
  { x: 400, y: 300 },
  { x: 300, y: 300 },
];
const OPTIONS = {
  backgroundColor: 0x1099bb,
  height: 600,
  width: 800,
};

function CustomComponentExample() {
  const [color, setColor] = useState(0);
  const [position, setPosition] = useState(0);

  useInterval(() => {
    setColor(color => (color + 1) % COLORS.length);
    setPosition(position => (position + 1) % POSITIONS.length);
  }, 2000);

  return (
    <Stage options={OPTIONS}>
      <DraggableContainer>
        <Circle fill={0xffff00} radius={50} x={50} y={50} />
        <Text anchor="0.5,0.5" style={{ align: "center", fontSize: 20 }} text={"drag\nme\nnow"} x={50} y={50} />
      </DraggableContainer>
      <Rect fill={COLORS[color]} height={100} width={100} x={POSITIONS[position].x} y={POSITIONS[position].y} />
    </Stage>
  );
}

export default CustomComponentExample;
