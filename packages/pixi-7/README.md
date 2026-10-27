# @react-pixi-fiber/pixi-7

PixiJS 7 adapter for [react-pixi-fiber](https://github.com/michalochman/react-pixi-fiber). It tells `react-pixi-fiber` how to create the PixiJS 7 classes for the 13 Display Object tags and the 5 filter tags. It also tells which props it types and how to create a `PIXI.Application`.

Install it next to `react-pixi-fiber`, `pixi.js` 7.2 or newer (the first with `eventMode`) and a React adapter from the [adapter table](../react-pixi-fiber/README.md#setup), then configure once in the app entry, before the first render:

```js
import { configure } from "react-pixi-fiber";
import reactN from "@react-pixi-fiber/react-N"; // the React adapter for your React version
import pixi7 from "@react-pixi-fiber/pixi-7";

configure({ react: reactN(), pixi: pixi7() });
```

## Supported features

Features that are plain PixiJS work as the [PixiJS 7 documentation](https://pixijs.download/v7.4.3/docs/index.html) describes.

| Tag | Creates |
| --- | --- |
| `AlphaFilter` | `PIXI.AlphaFilter` |
| `AnimatedSprite` | `PIXI.AnimatedSprite` |
| `BitmapText` | `PIXI.BitmapText` |
| `BlurFilter` | `PIXI.BlurFilter` |
| `ColorMatrixFilter` | `PIXI.ColorMatrixFilter` |
| `Container` | `PIXI.Container` |
| `DisplacementFilter` | `PIXI.DisplacementFilter`, from `sprite` and `scale` |
| `FXAAFilter` | `PIXI.FXAAFilter`, a tag of this adapter. Import it from this package |
| `Graphics` | `PIXI.Graphics`, `geometry` is passed to the constructor |
| `HTMLText` | `PIXI.HTMLText`, a tag of this adapter. Import it from this package |
| `Mesh` | `PIXI.Mesh`, from `geometry`, `shader`, `state` and `drawMode` |
| `MeshPlane`, `SimplePlane` | `PIXI.SimplePlane` |
| `MeshRope`, `SimpleRope` | `PIXI.SimpleRope` |
| `MeshSimple`, `SimpleMesh` | `PIXI.SimpleMesh` |
| `NineSliceSprite`, `NineSlicePlane` | `PIXI.NineSlicePlane` |
| `NoiseFilter` | `PIXI.NoiseFilter` |
| `ParticleContainer` | `PIXI.ParticleContainer` |
| `Sprite` | `PIXI.Sprite` |
| `Text` | `PIXI.Text` |
| `TilingSprite` | `PIXI.TilingSprite` |

`NineSlicePlane`, `SimpleMesh`, `SimplePlane` and `SimpleRope` are the PixiJS 7 class names. Each is a tag of its own: `defaults` and `PIXIProperty` keyed by `NineSliceSprite` do not apply to `<NineSlicePlane />`, and `getInstanceTag` returns `"NineSlicePlane"` for it. Import them from this package.

| Feature | Support |
| --- | --- |
| Application | `Stage` creates a `PIXI.Application` from `options`; `view` defaults to the canvas `Stage` renders |
| `compat` option | Takes the translator from `@react-pixi-fiber/pixi-7/compat/pixi6`, which translates the PixiJS 6 props, see [below](#compatibility-with-the-2x-props) |
| `defaults` option | Default props per tag, like React's `defaultProps`: with `pixi7({ defaults: { Sprite: { alpha: 0.5 } } })`, `<Sprite />` mounts with `alpha` 0.5. A prop missing or `undefined` when the instance is created gets its default, and `create` sees it; a prop removed later, or set to `undefined`, returns to it. An explicit `null` is kept. Key each tag as you write it. Without an entry, a removed prop returns to the value the instance had before the first write, see [Default props per tag](../react-pixi-fiber/README.md#default-props-per-tag) |
| Events | The PixiJS 7 handler properties as props: `onclick`, `onpointerdown`, …, with `eventMode` to make an object interactive. `onpointermove` runs only while the pointer is over the object, `onglobalpointermove` on every move. PixiJS 7 does not call a property named after the event, so without `compat`, `click={fn}` or `pointerdown={fn}` is set on the instance, never runs, and warns once in development; so does `buttonMode`, which PixiJS 7 no longer reads (use `cursor`) |
| Ticker | A `usePixiTicker` callback receives the frame delta, as `app.ticker.add` passes it |
| TypeScript | Importing the package types the props of every tag from the PixiJS 7 classes; type event handlers with `FederatedPointerEvent` from `pixi.js`. `PixiTypeFallback` imports from this package. `style` on `Text` and `HTMLText`, and `text` on `Text`, take what the PixiJS setter takes, for example a style object or a number; the other props take the getter type |

## Compatibility with the 2.x props

Apps written for PixiJS 6 can keep their interaction props while they migrate. Pass the default export of the compat module to `pixi7`:

```js
import pixi7 from "@react-pixi-fiber/pixi-7";
import compat from "@react-pixi-fiber/pixi-7/compat/pixi6";

configure({ react: reactN(), pixi: pixi7({ compat }) });
```

PixiJS 4 and 5 apps use `compat/pixi6` too: PixiJS 5 and 6 renamed none of the props it translates. Without the import, the adapter holds no compat code.

With `compat`, the adapter translates the props before the core reads them:

| Prop | Becomes |
| --- | --- |
| `buttonMode` | `cursor: "pointer"`, or `cursor: null` when false |
| `click`, `pointerdown`, … (the event names) | `onclick`, `onpointerdown`, … |
| `interactive` | `eventMode: "static"`, or `eventMode: "auto"` when false, as the PixiJS 7 `interactive` setter does, without its deprecation warning |
| `mousemove`, `pointermove`, `touchmove` | `onglobalmousemove`, `onglobalpointermove`, `onglobaltouchmove`: the handler runs on every move, over the object or not, as in PixiJS 6 |

`name` is a PixiJS 7 prop and is not translated; neither are `added` and `removed`. In development each translated prop warns once, naming the PixiJS 7 prop to use instead. When a translated prop and its PixiJS 7 prop are both passed (`interactive` and `eventMode`), the PixiJS 7 prop wins, with one warning naming both. A `PIXIComponent` with its own `applyProps` receives the props as written.

The compat module also types the translated props on every tag, as deprecated, so TypeScript needs no other import.

## Migrating from `@react-pixi-fiber/pixi-6`

1. Install `@react-pixi-fiber/pixi-7` and `pixi.js` 7.2 or newer, and pass `pixi7()` to `configure` instead of `pixi6()`. To keep the PixiJS 6 props while you migrate, pass `compat` from `@react-pixi-fiber/pixi-7/compat/pixi6`, see [above](#compatibility-with-the-2x-props).
2. Follow the [PixiJS 7 migration guide](https://github.com/pixijs/pixijs/wiki/v7-Migration-Guide) for the PixiJS calls in your app.

What changes for `react-pixi-fiber` code:

- `HTMLText` is a new tag.
- Rename the event props to the handler properties: `click` to `onclick`, `pointerdown` to `onpointerdown`, and so on; a move handler that must run while the pointer is off the object, as a drag does, becomes `onglobalpointermove`. PixiJS 7 calls only the `on` properties, so without `compat` an event prop left as `click` is set on the instance, never runs, and warns once in development.
- `buttonMode` becomes `cursor="pointer"`, `interactive` becomes `eventMode="static"`.
- `InteractionCompatibility`, `InteractionEventCompatibility` and `InteractiveComponent` are not exported: PixiJS 7 has no `PIXI.InteractionEvent`. Type event handlers with `FederatedPointerEvent`.
