# @react-pixi-fiber/pixi-6

PixiJS 6 adapter for [react-pixi-fiber](https://github.com/michalochman/react-pixi-fiber). It tells `react-pixi-fiber` how to create the PixiJS 6 Display Objects for all 13 core tags, which props it types, and how to create a `PIXI.Application`.

Install it next to `react-pixi-fiber`, `pixi.js` 6 and a React adapter from the [adapter table](../react-pixi-fiber/README.md#setup), then configure once in the app entry, before the first render:

```js
import { configure } from "react-pixi-fiber";
import reactN from "@react-pixi-fiber/react-N"; // the React adapter for your React version
import pixi6 from "@react-pixi-fiber/pixi-6";

configure({ react: reactN(), pixi: pixi6() });
```

## Supported features

Features that are plain PixiJS work as the [PixiJS 6 documentation](https://pixijs.download/v6.5.10/docs/index.html) describes.

| Tag | Creates |
| --- | --- |
| `AnimatedSprite` | `PIXI.AnimatedSprite` |
| `BitmapText` | `PIXI.BitmapText` |
| `Container` | `PIXI.Container` |
| `Graphics` | `PIXI.Graphics`, `geometry` is passed to the constructor |
| `Mesh` | `PIXI.Mesh`, from `geometry`, `shader`, `state` and `drawMode` |
| `MeshPlane`, `SimplePlane` | `PIXI.SimplePlane` |
| `MeshRope`, `SimpleRope` | `PIXI.SimpleRope` |
| `MeshSimple`, `SimpleMesh` | `PIXI.SimpleMesh` |
| `NineSliceSprite`, `NineSlicePlane` | `PIXI.NineSlicePlane` |
| `ParticleContainer` | `PIXI.ParticleContainer` |
| `Sprite` | `PIXI.Sprite` |
| `Text` | `PIXI.Text` |
| `TilingSprite` | `PIXI.TilingSprite` |

`NineSlicePlane`, `SimpleMesh`, `SimplePlane` and `SimpleRope` are the PixiJS 6 class names. Each is a tag of its own: `defaults` and `PIXIProperty` keyed by `NineSliceSprite` do not apply to `<NineSlicePlane />`, and `getInstanceTag` returns `"NineSlicePlane"` for it. Import them from this package.

| Feature | Support |
| --- | --- |
| Application | `Stage` creates a `PIXI.Application` from `options`; `view` defaults to the canvas `Stage` renders |
| `defaults` option | Default props per tag, like React's `defaultProps`: with `pixi6({ defaults: { Sprite: { alpha: 0.5 } } })`, `<Sprite />` mounts with `alpha` 0.5. A prop missing or `undefined` when the instance is created gets its default, and `create` sees it; a prop removed later, or set to `undefined`, returns to it. An explicit `null` is kept. Key each tag as you write it. Without an entry, a removed prop returns to the value the instance had before the first write, see [Default props per tag](../react-pixi-fiber/README.md#default-props-per-tag) |
| Events | The PixiJS 6 interaction events as props: `click`, `pointerdown`, `tap`, …, with `interactive` and `buttonMode` |
| Ticker | A `usePixiTicker` callback receives the frame delta, as `app.ticker.add` passes it |
| TypeScript | Importing the package types the props of every tag from the PixiJS 6 classes and types the event props. `InteractionCompatibility`, `InteractionEventCompatibility`, `InteractiveComponent` and `PixiTypeFallback` import from this package |

## Migrating from `@react-pixi-fiber/pixi-5`

1. Install `@react-pixi-fiber/pixi-6` and `pixi.js` 6, and pass `pixi6()` to `configure` instead of `pixi5()`.
2. Follow the [PixiJS 6 migration guide](https://github.com/pixijs/pixijs/wiki/v6-Migration-Guide) for the PixiJS calls in your app.

What changes for `react-pixi-fiber` code:

- Tags, aliases, event props and exported types stay the same.
- Development prop validation also checks `nativeLines` as a boolean and `fillAlpha` and `lineColor` as non-negative numbers.
