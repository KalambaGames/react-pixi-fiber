# @react-pixi-fiber/pixi-5

PixiJS 5 adapter for [react-pixi-fiber](https://github.com/KalambaGames/react-pixi-fiber). It tells `react-pixi-fiber` how to create the PixiJS 5 classes for the 13 Display Object tags and the 5 filter tags. It also tells which props it types and how to create a `PIXI.Application`.

Install it next to `react-pixi-fiber`, `pixi.js` 5 and a React adapter from the [adapter table](../react-pixi-fiber/README.md#setup), then configure once in the app entry, before the first render:

```js
import { configure } from "react-pixi-fiber";
import reactN from "@react-pixi-fiber/react-N"; // the React adapter for your React version
import pixi5 from "@react-pixi-fiber/pixi-5";

configure({ react: reactN(), pixi: pixi5() });
```

## Supported features

Features that are plain PixiJS work as the [PixiJS 5 documentation](https://pixijs.download/v5.3.12/docs/index.html) describes.

| Tag | Creates |
| --- | --- |
| `AlphaFilter` | `PIXI.filters.AlphaFilter` |
| `AnimatedSprite` | `PIXI.AnimatedSprite` |
| `BitmapText` | `PIXI.BitmapText` |
| `BlurFilter` | `PIXI.filters.BlurFilter` |
| `ColorMatrixFilter` | `PIXI.filters.ColorMatrixFilter` |
| `Container` | `PIXI.Container` |
| `DisplacementFilter` | `PIXI.filters.DisplacementFilter`, from `sprite` and `scale` |
| `FXAAFilter` | `PIXI.filters.FXAAFilter`, a tag of this adapter. Import it from this package |
| `Graphics` | `PIXI.Graphics`, `geometry` is passed to the constructor |
| `Mesh` | `PIXI.Mesh`, from `geometry`, `shader`, `state` and `drawMode` |
| `MeshPlane`, `SimplePlane` | `PIXI.SimplePlane` |
| `MeshRope`, `SimpleRope` | `PIXI.SimpleRope` |
| `MeshSimple`, `SimpleMesh` | `PIXI.SimpleMesh` |
| `NineSliceSprite`, `NineSlicePlane` | `PIXI.NineSlicePlane` |
| `NoiseFilter` | `PIXI.filters.NoiseFilter` |
| `ParticleContainer` | `PIXI.ParticleContainer` |
| `Sprite` | `PIXI.Sprite` |
| `Text` | `PIXI.Text` |
| `TilingSprite` | `PIXI.TilingSprite` |

`NineSlicePlane`, `SimpleMesh`, `SimplePlane` and `SimpleRope` are the PixiJS 5 class names. Each is a tag of its own: `defaults` and `PIXIProperty` keyed by `NineSliceSprite` do not apply to `<NineSlicePlane />`, and `getInstanceTag` returns `"NineSlicePlane"` for it. Import them from this package.

When a filter element or an ancestor unmounts, this adapter releases the filter without a call to `destroy`. This applies to every filter the core created, built-in or registered with `PIXIFilter`. A behavior's `beforeRemove` is the place for custom cleanup. On PixiJS 5, `Filter.destroy` frees nothing and leaves the renderer's bound shader dangling, so the next frame throws.

| Feature | Support |
| --- | --- |
| Application | `Stage` creates a `PIXI.Application` from `options`; `view` defaults to the canvas `Stage` renders |
| `defaults` option | Default props per tag, like React's `defaultProps`: with `pixi5({ defaults: { Sprite: { alpha: 0.5 } } })`, `<Sprite />` mounts with `alpha` 0.5. A prop missing or `undefined` when the instance is created gets its default, and `create` sees it; a prop removed later, or set to `undefined`, returns to it. An explicit `null` is kept. Key each tag as you write it. Without an entry, a removed prop returns to the value the instance had before the first write, see [Default props per tag](../react-pixi-fiber/README.md#default-props-per-tag) |
| Events | The PixiJS 5 interaction events as props: `click`, `pointerdown`, `tap`, …, with `interactive` and `buttonMode` |
| Ticker | A `usePixiTicker` callback receives the frame delta, as `app.ticker.add` passes it |
| TypeScript | Importing the package types the props of every tag from the PixiJS 5 classes and types the event props. `InteractionCompatibility`, `InteractionEventCompatibility`, `InteractiveComponent` and `PixiTypeFallback` import from this package |

## Migrating from `@react-pixi-fiber/pixi-4`

1. Install `@react-pixi-fiber/pixi-5` and `pixi.js` 5, and pass `pixi5()` to `configure` instead of `pixi4()`.
2. Follow the [PixiJS 5 migration guide](https://github.com/pixijs/pixijs/wiki/v5-Migration-Guide) for the PixiJS calls in your app.

What changes for `react-pixi-fiber` code:

- `Mesh` creates a `PIXI.Mesh` from `geometry` and `shader`. For a textured mesh from `texture`, `vertices`, `uvs` and `indices`, use `MeshSimple`, which creates a `PIXI.SimpleMesh`.
- The tags `Plane` and `Rope` are `SimplePlane` and `SimpleRope`, or the core tags `MeshPlane` and `MeshRope`. `SimpleMesh` is new.
- `Graphics` passes `geometry` to the constructor instead of `nativeLines`, and `MeshRope` also passes `textureScale`.
- PixiJS 5 ships its own typings: remove `@types/pixi.js`.
