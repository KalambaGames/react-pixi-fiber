// `pixi7({ compat })` with this module's default export translates the PixiJS 6 props that PixiJS 7 dropped.
import type { FederatedPointerEvent } from "pixi.js";

import warning from "../warning";

type Rename = (value: unknown) => Record<string, unknown>;
type Handler = (event: FederatedPointerEvent) => void;

declare module "react-pixi-fiber" {
  interface PixiExtraProps {
    /** @deprecated PixiJS 6 prop, translated to `cursor`. */
    buttonMode?: boolean;
    /** @deprecated PixiJS 6 prop, translated to `onclick`. */
    click?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `eventMode`. */
    interactive?: boolean;
    /** @deprecated PixiJS 6 prop, translated to `onmousedown`. */
    mousedown?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onglobalmousemove`. */
    mousemove?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onmouseout`. */
    mouseout?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onmouseover`. */
    mouseover?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onmouseup`. */
    mouseup?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onmouseupoutside`. */
    mouseupoutside?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onpointercancel`. */
    pointercancel?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onpointerdown`. */
    pointerdown?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onglobalpointermove`. */
    pointermove?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onpointerout`. */
    pointerout?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onpointerover`. */
    pointerover?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onpointertap`. */
    pointertap?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onpointerup`. */
    pointerup?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onpointerupoutside`. */
    pointerupoutside?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onrightclick`. */
    rightclick?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onrightdown`. */
    rightdown?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onrightup`. */
    rightup?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onrightupoutside`. */
    rightupoutside?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `ontap`. */
    tap?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `ontouchcancel`. */
    touchcancel?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `ontouchend`. */
    touchend?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `ontouchendoutside`. */
    touchendoutside?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `onglobaltouchmove`. */
    touchmove?: Handler;
    /** @deprecated PixiJS 6 prop, translated to `ontouchstart`. */
    touchstart?: Handler;
  }
}

const LEGACY_EVENTS = [
  "click",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "mouseupoutside",
  "pointercancel",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointertap",
  "pointerup",
  "pointerupoutside",
  "rightclick",
  "rightdown",
  "rightup",
  "rightupoutside",
  "tap",
  "touchcancel",
  "touchend",
  "touchendoutside",
  "touchmove",
  "touchstart",
];

// `interactive` mirrors the setter PixiJS 7 keeps for it, without its deprecation warning.
const table: Record<string, Rename> = {
  buttonMode: value => ({ cursor: value ? "pointer" : null }),
  interactive: value => ({ eventMode: value ? "static" : "auto" }),
};
for (const name of LEGACY_EVENTS) table[name] = value => ({ [`on${name}`]: value });
// PixiJS 6 sent move events to every interactive object, hit or not; `on*move` fires only on a hit.
for (const name of ["mousemove", "pointermove", "touchmove"]) table[name] = value => ({ [`onglobal${name}`]: value });

const warned: Record<string, boolean> = {};

export default function translateProps(type: string, props: Record<string, unknown>): Record<string, unknown> {
  let out: Record<string, unknown> | null = null;
  for (const name in props) {
    if (!Object.prototype.hasOwnProperty.call(props, name)) continue;
    const rename = Object.prototype.hasOwnProperty.call(table, name) ? table[name] : null;
    if (rename === null) {
      if (out !== null) out[name] = props[name];
      continue;
    }
    if (out === null) {
      // Copy the props before the first renamed one; the loop copies the rest.
      out = {};
      for (const key in props) {
        if (key === name) break;
        out[key] = props[key];
      }
    }
    const renamed = rename(props[name]);
    if (__DEV__ && !warned[name]) {
      warned[name] = true;
      warning(
        false,
        "`%s` on `<%s />` is a PixiJS 6 prop, translated by the `compat` option of `pixi7`. Rename it to %s to drop the translation.",
        name,
        type,
        Object.keys(renamed)
          .map(key => `\`${key}\``)
          .join(" and ")
      );
    }
    for (const key in renamed) {
      // The PixiJS 7 prop, when also passed, wins over the translated one.
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        if (__DEV__ && !warned[`${name} ${key}`]) {
          warned[`${name} ${key}`] = true;
          warning(false, "`%s` and `%s` are both set on `<%s />`. `%s` wins; remove `%s`.", name, key, type, key, name);
        }
      } else {
        out[key] = renamed[key];
      }
    }
  }
  return out === null ? props : out;
}
