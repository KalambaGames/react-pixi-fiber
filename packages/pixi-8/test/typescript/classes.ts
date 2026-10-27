// Type-checked by `check-types`, not run: `pixi8` takes no `classes`, and `pixi8WithClasses` needs them.
import pixi8, { pixi8WithClasses } from "../../src/index";
import { Sprite } from "pixi.js";

export const withoutOptions = () => pixi8();
// @ts-expect-error
export const pixi8WithList = () => pixi8({ classes: { Sprite } });
// @ts-expect-error
export const listWithoutOptions = () => pixi8WithClasses();
// @ts-expect-error
export const listWithoutClasses = () => pixi8WithClasses({});
export const list = () => pixi8WithClasses({ classes: { Sprite } });
