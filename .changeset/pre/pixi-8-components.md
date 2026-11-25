---
"@react-pixi-fiber/pixi-8": minor
---

`pixi8WithClasses` takes the PixiJS classes that the app renders as `classes`: Display Objects, filters and `Application`. A bundle of the ES build holds only those classes. `pixi8()` keeps every class:

```js
import { Application, Container, Sprite, Text } from "pixi.js";
import { pixi8WithClasses } from "@react-pixi-fiber/pixi-8";

configure({ react: react18(), pixi: pixi8WithClasses({ classes: { Application, Container, Sprite, Text } }) });
```

A tag left out of the list throws at first render, and the error names the class to add. `ParticleContainer` needs `Particle` in the list. Without `Application` in the list, `Stage` needs an `app` prop. That `app` needs a `Container` as `stage`, and a `ticker` for `usePixiTicker`. So an app can make its own renderer. `allClasses` holds every class that `pixi8()` uses.
