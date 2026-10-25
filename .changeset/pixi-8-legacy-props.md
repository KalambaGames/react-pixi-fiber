---
"@react-pixi-fiber/pixi-8": patch
---

Without `compat`, the development build warns once for each PixiJS 6 prop that PixiJS 8 ignores, for example `click` or `buttonMode`. The warning names `@react-pixi-fiber/pixi-8/compat/pixi6` and `/compat/pixi7`. Before, such a prop did nothing, and nothing said so.

`origin` is typed as a point prop, like `pivot`. An invalid value resets it to its default with a warning.
