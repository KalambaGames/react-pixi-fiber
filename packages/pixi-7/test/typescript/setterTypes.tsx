// Type-checked by `check-types`, not run: a prop accepts what the PixiJS setter accepts, not only the getter type.
import React from "react";
import * as PIXI from "pixi.js";
import { PIXIComponent, Text } from "react-pixi-fiber";
import { HTMLText } from "../../src/index";

const style = { fill: "white", fontSize: 16 } as const;

export const text = <Text style={style} />;
export const textNumber = <Text text={42} />;
export const htmlText = <HTMLText style={new PIXI.HTMLTextStyle({ fontSize: 16 })} />;
export const htmlTextObject = <HTMLText style={style} />;

const Label = PIXIComponent<PIXI.Text>("Label", { create: () => new PIXI.Text() });
export const label = <Label style={style} />;

// @ts-expect-error `wordWrap` takes a boolean
export const wrongStyle = <Text style={{ wordWrap: "yes" }} />;
