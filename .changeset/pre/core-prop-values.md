---
"react-pixi-fiber": patch
---

An explicit `null` on a callback prop, for example `onclick={null}`, is written as `null`. Before, the core reset it to its default and warned under `StrictMode`.

An explicit `null` on a point prop is written as `null`, so the PixiJS setter throws its own error, as it does without react-pixi-fiber. Before, the core reset it to its default and warned.

An invalid value for a point prop that the PixiJS adapter does not list as a point, for example a point prop of a custom component, resets the prop to its default with a warning. Before, `"a,b"` wrote `NaN` coordinates and three coordinates threw.

The warning for an invalid prop value prints once for each prop name, not on every write.

A suspended instance that becomes visible again gets the `visible` default of the PixiJS adapter, or the value PixiJS had, when the element has no `visible` prop. Before, it always became visible.

`usePixiApp` and `usePixiTicker` throw an `Invariant Violation`, like the other core errors.

The warning for the deprecated `width` and `height` props of `Stage` names 4.0.0 as the major that removes them, and `createStageClass` is marked `@deprecated` for editors.
