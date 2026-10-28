import * as PIXI from "pixi.js";
import React, { Fragment, useContext, useEffect, useRef, useState } from "react";
import { PIXIComponent, Stage, Text, usePixiTicker } from "react-pixi-fiber";

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
    instance.beginFill(fill);
    instance.drawCircle(x, y, radius);
    instance.endFill();

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
    instance.beginFill(fill);
    instance.drawRect(x, y, width, height);
    instance.endFill();

    this.applyDisplayObjectProps(oldPropsRest, newPropsRest);
  },
});

// returns a base 10 translation of a gray scale hex string build from a single
// number between 0 and 255. if num is > 255 or < 0 it's clamped to the limit.
const grayFromNum = (num: number) => {
  const hex = ("00" + Math.max(0, Math.min(255, num)).toString(16)).substr(-2);
  return parseInt(`${hex.repeat(3)}`, 16);
};

/**
 * Implements `react-pixi-fiber`'s `usePixiTicker` hook, and the `useState` hook.
 * Handles animation of the circle and square background.
 */
type AnimatedValueOptions = {
  direction: number;
  enabled: boolean;
  max: number;
  min: number;
  value: number;
};

function useAnimatedValue({ direction, enabled, max, min, value }: AnimatedValueOptions) {
  const [data, setData] = useState({ direction, max, min, value });

  const animate = () => {
    setData(current => {
      const data = { ...current };

      // flip direction once min or max has been reached.
      if (
        (current.value >= current.max && current.direction === 1) ||
        (current.value <= current.min && current.direction === -1)
      ) {
        data.direction *= -1;
      }

      // increment or decrement `
      data.value += data.direction;

      return data;
    });
  };

  // `enabled: false` removes `animate` from the ticker. `true` adds it back. The component stays mounted.
  usePixiTicker(animate, { enabled });

  return data.value;
}

const AnimationContext = React.createContext({ title: "" });

/**
 * implements `useContext`, `useEffect` and `useRef`.
 */
const Title = () => {
  const { title } = useContext(AnimationContext);
  const pixiText = useRef<PIXI.Text>(null);

  // horizontally center the title's pivot point. this also works fine with `useEffect`.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the text width changes with the title
  useEffect(() => {
    if (pixiText.current) {
      pixiText.current.pivot.set(pixiText.current.width / 2, 0);
    }
  }, [title]);

  return <Text ref={pixiText} text={title} x={200} y={0} />;
};

const Animation = () => {
  const [paused, setPaused] = useState(false);
  const number1 = useAnimatedValue({ direction: 1, enabled: !paused, max: 255, min: 0, value: 0 });
  const number2 = useAnimatedValue({ direction: -1, enabled: !paused, max: 255, min: 0, value: 255 });
  const [text1, setText1] = useState(`number1: ${number1}`);
  const [text2, setText2] = useState(`number2: ${number2}`);

  // update the contents of the `Text` instances.
  useEffect(() => {
    setText1(`number1: ${number1}`);
    setText2(`number2: ${number2}`);
  }, [number1, number2]);

  return (
    <Fragment>
      <Title />
      <Rect fill={grayFromNum(number1)} height={124} width={124} x={138} y={88} />
      <Circle
        cursor="pointer"
        fill={grayFromNum(number2)}
        interactive
        pointerdown={() => setPaused(paused => !paused)}
        radius={50}
        x={200}
        y={150}
      />
      <Text text={text1} x={0} y={226} />
      <Text text={text2} x={0} y={262} />
    </Fragment>
  );
};

const HooksExample = () => {
  return (
    <Stage options={{ backgroundColor: 0xff0000, height: 300, width: 400 }}>
      <AnimationContext.Provider value={{ title: "animation" }}>
        <Animation />
      </AnimationContext.Provider>
    </Stage>
  );
};

export default HooksExample;
