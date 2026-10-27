---
"@react-pixi-fiber/pixi-8": minor
---

The PixiJS 8 adapter creates the filter tags `AlphaFilter`, `BlurFilter`, `ColorMatrixFilter`, `DisplacementFilter` and `NoiseFilter` from the PixiJS 8 options objects.

The blur prop of `BlurFilter` is `strength`. `blur` works, but PixiJS 8 logs its own deprecation for it. `strengthX` and `strengthY` each override `strength` for one axis. A filter tag accepts `resolution="inherit"`. PixiJS 8 has no `FXAAFilter`.

The filters are in `pixi8()` and `allClasses`. With `pixi8WithClasses`, list only the filter tags the app renders.
