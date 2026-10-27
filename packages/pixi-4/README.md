# @react-pixi-fiber/pixi-4

PixiJS 4 adapter for [react-pixi-fiber](https://github.com/KalambaGames/react-pixi-fiber). It tells `react-pixi-fiber` how to create the PixiJS 4 classes for the 13 Display Object tags and the 5 filter tags. It also tells which props it types and how to create a `PIXI.Application`.

Install it next to `react-pixi-fiber`, `pixi.js` 4, for TypeScript `@types/pixi.js` 4 (PixiJS 4 ships no typings, so it is an optional peer) and a React adapter from the [adapter table](../react-pixi-fiber/README.md#setup), then configure once in the app entry, before the first render:

```js
import { configure } from "react-pixi-fiber";
import reactN from "@react-pixi-fiber/react-N"; // the React adapter for your React version
import pixi4 from "@react-pixi-fiber/pixi-4";

configure({ react: reactN(), pixi: pixi4() });
```

## Supported features

Features that are plain PixiJS work as the [PixiJS 4 documentation](https://pixijs.download/v4.8.9/docs/index.html) describes.

| Tag | Creates |
| --- | --- |
| `AlphaFilter` | `PIXI.filters.AlphaFilter` |
| `AnimatedSprite` | `PIXI.extras.AnimatedSprite` |
| `BitmapText` | `PIXI.extras.BitmapText` |
| `BlurFilter` | `PIXI.filters.BlurFilter` |
| `ColorMatrixFilter` | `PIXI.filters.ColorMatrixFilter` |
| `Container` | `PIXI.Container` |
| `DisplacementFilter` | `PIXI.filters.DisplacementFilter`, from `sprite` and `scale` |
| `FXAAFilter` | `PIXI.filters.FXAAFilter`, a tag of this adapter. Import it from this package |
| `Graphics` | `PIXI.Graphics`, `nativeLines` is passed to the constructor |
| `Mesh` | `PIXI.mesh.Mesh`, from `texture`, `vertices`, `uvs`, `indices` and `drawMode` |
| `MeshPlane`, `Plane` | `PIXI.mesh.Plane` |
| `MeshRope`, `Rope` | `PIXI.mesh.Rope` |
| `MeshSimple` | `PIXI.mesh.Mesh`, like `Mesh`: PixiJS 4 has one mesh class |
| `NineSliceSprite`, `NineSlicePlane` | `PIXI.mesh.NineSlicePlane` |
| `NoiseFilter` | `PIXI.filters.NoiseFilter` |
| `ParticleContainer` | `PIXI.particles.ParticleContainer` |
| `Sprite` | `PIXI.Sprite` |
| `Text` | `PIXI.Text` |
| `TilingSprite` | `PIXI.extras.TilingSprite` |

`NineSlicePlane`, `Plane` and `Rope` are the PixiJS 4 class names. Each is a tag of its own: `defaults` and `PIXIProperty` keyed by `NineSliceSprite` do not apply to `<NineSlicePlane />`, and `getInstanceTag` returns `"NineSlicePlane"` for it. Import them from this package.

| Feature | Support |
| --- | --- |
| Application | `Stage` creates a `PIXI.Application` from `options`; `view` is the `Stage` canvas |
| `defaults` option | Default props per tag, like React's `defaultProps`: with `pixi4({ defaults: { Sprite: { alpha: 0.5 } } })`, `<Sprite />` mounts with `alpha` 0.5. A prop missing or `undefined` when the instance is created gets its default, and `create` sees it; a prop removed later, or set to `undefined`, returns to it. An explicit `null` is kept. Key each tag as you write it. Without an entry, a removed prop returns to the value the instance had before the first write, see [Default props per tag](../react-pixi-fiber/README.md#default-props-per-tag) |
| Events | The PixiJS 4 interaction events as props: `click`, `pointerdown`, `tap`, …, with `interactive` and `buttonMode` |
| Ticker | A `usePixiTicker` callback receives the frame delta, as `app.ticker.add` passes it |
| TypeScript | Importing the package types the props of every tag from the PixiJS 4 classes and types the event props. PixiJS 4 ships no typings: install `@types/pixi.js` 4, an optional peer. `InteractionCompatibility`, `InteractionEventCompatibility`, `InteractiveComponent` and `PixiTypeFallback` import from this package |
