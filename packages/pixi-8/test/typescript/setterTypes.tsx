// Type-checked by `check-types`, not run: a prop accepts what the PixiJS setter accepts, not only the getter type.
import React from "react";
import * as PIXI from "pixi.js";
import { AnimatedSprite, BlurFilter, Graphics, PIXIComponent, Text } from "react-pixi-fiber";
import { HTMLText, Particle } from "../../src/index";

const style = { fill: "white", fontSize: 16 } as const;

export const text = <Text anchor={0.5} position="1,2" ref={(t: PIXI.Text | null) => t?.style.fill} style={style} />;
export const htmlText = <HTMLText style={{ cssOverrides: ["color: red"], fontSize: 16 }} />;

const Label = PIXIComponent<PIXI.Text>("Label", { create: () => new PIXI.Text() });
export const label = <Label style={style} />;

const Caption = PIXIComponent<PIXI.Text, { style: string }>("Caption", { create: () => new PIXI.Text() });
export const caption = <Caption style="title" />;
// @ts-expect-error props declared on the component replace the instance props
export const captionObject = <Caption style={style} />;

// @ts-expect-error `wordWrap` takes a boolean
export const wrongStyle = <Text style={{ wordWrap: "yes" }} />;

// The setter of `text` takes any value with `toString`. A point value fits that type, but `text` is not a point prop.
export const textObject = <Text text={{ toString: () => "hi" }} />;

// The options types do not declare these setters.
export const graphics = <Graphics fillStyle={0xff0000} strokeStyle={{ color: "red", width: 2 }} />;
export const particle = <Particle texture={PIXI.Texture.WHITE} tint="red" />;

// @ts-expect-error a key only in the options type does not become a prop
export const autoPlay = <AnimatedSprite autoPlay textures={[PIXI.Texture.WHITE]} />;
export const playing = <AnimatedSprite loop={false} onComplete={() => {}} playing textures={[PIXI.Texture.WHITE]} />;
// @ts-expect-error `playing` takes a boolean
export const playingString = <AnimatedSprite playing="yes" textures={[PIXI.Texture.WHITE]} />;

// `BlurFilterOptions` declares `strength`. `blur` is a deprecated setter of the filter, so it still type-checks.
export const blurStrength = <BlurFilter strength={2} />;
export const blurKernelSize = <BlurFilter kernelSize={7} />;
export const blurBlur = <BlurFilter blur={2} />;
// @ts-expect-error a filter has no Scene Object props
export const blurX = <BlurFilter x={1} />;
