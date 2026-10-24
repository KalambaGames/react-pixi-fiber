<div align="center">
  <img alt="ReactPixiFiber" src="./react-pixi.svg" width="500" />
</div>

<div align="center">
  <h1>ReactPixiFiber – React Fiber renderer for PixiJS</h1>

  <p>
    ReactPixiFiber is a JavaScript library for writing <a href="https://pixijs.com/">PixiJS</a> applications using <a href="https://reactjs.org/">React</a> declarative style. An adapter for your React version and one for your PixiJS version plug it in, see <a href="#setup">Setup</a>.
    <br />
    For React <16.0.0 see <a href="https://github.com/Izzimach/react-pixi">react-pixi</a>.
  </p>

  <a href="https://npmjs.com/package/react-pixi-fiber">
    <img alt="npm" src="https://img.shields.io/npm/v/react-pixi-fiber.svg" />
  </a>
  <a href="./LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/michalochman/react-pixi-fiber.svg" />
  </a>
  <a href="https://github.com/KalambaGames/react-pixi-fiber/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/KalambaGames/react-pixi-fiber/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://biomejs.dev">
    <img alt="formatted with Biome" src="https://img.shields.io/badge/formatted_with-Biome-60a5fa.svg" />
  </a>
</div>

## Demo

The playgrounds cover the API. They are hosted at https://react-pixi-fiber.pages.dev (the root opens the PixiJS 8 playground, `/pixi-7/` the PixiJS 7 playground). To run them locally, use `pnpm install`, `pnpm build` and `pnpm start` in the repository.


## Installing

Install the core, one React adapter and one PixiJS adapter next to [React] and [PixiJS]. For React 18 and PixiJS 6:

    npm install react-pixi-fiber @react-pixi-fiber/react-18 @react-pixi-fiber/pixi-6 react pixi.js@6

or

    yarn add react-pixi-fiber @react-pixi-fiber/react-18 @react-pixi-fiber/pixi-6 react pixi.js@6

This package works with [Vite](https://vite.dev) and webpack based setups such as [Create React App](https://github.com/facebookincubator/create-react-app) – the examples below use Vite.

## Setup

Call `configure` once in the app entry, before the first render:

```js
import { configure } from "react-pixi-fiber";
import react18 from "@react-pixi-fiber/react-18";
import pixi6 from "@react-pixi-fiber/pixi-6";

configure({ react: react18(), pixi: pixi6() });
```

Components import only from `react-pixi-fiber`, so a shared component library does not depend on the React or PixiJS version. Pick the adapters that match the versions the app installs:

| Adapter | Supports |
| --- | --- |
| [`@react-pixi-fiber/react-17`](https://www.npmjs.com/package/@react-pixi-fiber/react-17) | `react` ^17.0.2 |
| [`@react-pixi-fiber/react-18`](https://www.npmjs.com/package/@react-pixi-fiber/react-18) | `react` ^18.3.1 |
| [`@react-pixi-fiber/react-19`](https://www.npmjs.com/package/@react-pixi-fiber/react-19) | `react` ^19.3.0 |
| [`@react-pixi-fiber/pixi-4`](https://www.npmjs.com/package/@react-pixi-fiber/pixi-4) | `pixi.js` ^4.4.0 |
| [`@react-pixi-fiber/pixi-5`](https://www.npmjs.com/package/@react-pixi-fiber/pixi-5) | `pixi.js` ^5.0.0 |
| [`@react-pixi-fiber/pixi-6`](https://www.npmjs.com/package/@react-pixi-fiber/pixi-6) | `pixi.js` ^6.0.0 |
| [`@react-pixi-fiber/pixi-7`](https://www.npmjs.com/package/@react-pixi-fiber/pixi-7) | `pixi.js` ^7.2.0 |
| [`@react-pixi-fiber/pixi-8`](https://www.npmjs.com/package/@react-pixi-fiber/pixi-8) | `pixi.js` ^8.9.0 |

Without `configure`, the first render throws an error that prints the install line and these setup lines.

Each adapter's README lists the features it supports and what changes when you move to it from the previous major.

### Which adapters do I need

Read the major version of `react` in your `package.json` for the React adapter (`"react": "^18.3.1"` needs `@react-pixi-fiber/react-18`) and the major version of `pixi.js` for the PixiJS adapter (`"pixi.js": "^7.4.3"` needs `@react-pixi-fiber/pixi-7`). Every PixiJS adapter implements all 13 [tags](#tags).

### Compatibility matrix

Every React adapter works with every PixiJS adapter:

| | `pixi-4`<br>`pixi.js` ^4.4.0 | `pixi-5`<br>`pixi.js` ^5.0.0 | `pixi-6`<br>`pixi.js` ^6.0.0 | `pixi-7`<br>`pixi.js` ^7.2.0 | `pixi-8`<br>`pixi.js` ^8.9.0 |
| --- | --- | --- | --- | --- | --- |
| `react-17`, `react` ^17.0.2, `react-reconciler` 0.26.2 | supported | supported | supported | supported | supported |
| `react-18`, `react` ^18.3.1, `react-reconciler` 0.29.2 | tested | tested | tested | tested | tested |
| `react-19`, `react` ^19.3.0, `react-reconciler` 0.34.0 | supported | supported | supported | supported | supported |

"tested": a test suite in this repository renders through this pair. The core suite runs on `react-18` and `pixi-6`, each PixiJS adapter's suite runs on `react-18`. "supported": the React adapter's suite runs against a fake PixiJS adapter and the PixiJS adapter's suite against `react-18`. The two meet only through `configure`, so the pair is expected to work but no test renders through it.

### React 17

`@react-pixi-fiber/react-17` needs React 17.0.2 or a later 17.x, the peer range of the `react-reconciler` it bundles. React 16 is not supported. Render with `ReactDOM.render`, see [Usage](#usage).

### React 19

`@react-pixi-fiber/react-19` needs React 19.3 or newer, the peer range of the `react-reconciler` it bundles.

- An error thrown while rendering is reported to `console.error` instead of being thrown from `render()`.
- `<ViewTransition>` inside `Stage` renders its children without animating.
- A `<Fragment ref>` inside `Stage` receives the fragment's top-level display objects: `children` lists them, `getBounds()` returns the bounds of each, and `on(event, fn)` and `off(event, fn)` add and remove a listener on each, including display objects added to the fragment later.

### PixiJS 4

- `Mesh` and `MeshSimple` both create `PIXI.mesh.Mesh`, the one mesh class of PixiJS 4.
- PixiJS 4 ships no typings. For TypeScript, install `@types/pixi.js` 4, an optional peer of `@react-pixi-fiber/pixi-4`.

### PixiJS 7

- `@react-pixi-fiber/pixi-7` needs PixiJS 7.2 or newer, the first with `eventMode`.
- PixiJS 7 calls only the handler properties such as `onclick` and `onpointerdown`, and no longer reads `buttonMode`. The 2.x props `click`, `pointerdown`, …, and `buttonMode` are set on the instance, do nothing, and warn once in development.
- `pixi7({ compat })`, with `compat` imported from `@react-pixi-fiber/pixi-7/compat/pixi6`, translates them: the event names to `onclick`, `onpointerdown`, …, `mousemove`, `pointermove` and `touchmove` to `onglobalmousemove`, `onglobalpointermove` and `onglobaltouchmove`, which run on every move as the 2.x move props did, `buttonMode` to `cursor` and `interactive` to `eventMode`. In development each translated prop warns once and names the replacement. PixiJS 4 and 5 apps use `compat/pixi6` too. Without the import, `pixi-7` holds no compat code.

### PixiJS 8

- `@react-pixi-fiber/pixi-8` needs PixiJS 8.9 or newer, the first with every tag it exports (`DOMContainer`; `ParticleContainer` with `Particle` since 8.5, `PerspectiveMesh` since 8.3, `RenderLayer` since 8.7).
- `pixi8()` bundles every PixiJS class that the adapter can create. `pixi8WithComponents({ components })` takes the PixiJS classes the app renders, and the bundle holds only those. A tag left out of the list throws at first render, naming the class to add, see [Choosing the classes](../pixi-8/README.md#choosing-the-classes).
- `Stage` creates the application with the asynchronous `app.init()`, so it renders its children after the application exists. Read the application in [`onInit`](#read-the-application-in-oninit-not-from-the-ref-at-mount).
- `usePixiTicker` callbacks receive the PixiJS 8 `Ticker`, not a delta: read `ticker.deltaTime`.
- `tint` accepts color strings as well as numbers.
- `ParticleContainer` takes `<Particle>` children, imported from `@react-pixi-fiber/pixi-8`, not display objects. A `Particle` needs a `texture` and takes the `Particle` fields as props (`x`, `y`, `scaleX`, `scaleY`, `anchorX`, `anchorY`, `rotation`, `tint`, `alpha`); a change to a prop that is not in the container's `dynamicProperties` calls the container's `update()`. `ParticleContainer` takes `dynamicProperties`, `roundPixels`, `shader` and `texture`, read when it is created.
- A Suspense boundary inside a `ParticleContainer` does not hide its particles while it shows a fallback (a boundary above the container hides the container), a `ParticleContainer` cannot be the container passed to `render`, and a `<Particle>` under any other container fails inside PixiJS.
- `pixi8({ compat })`, with `compat` imported from `@react-pixi-fiber/pixi-8/compat/pixi6` (or `/compat/pixi7`, the same module), translates the props that PixiJS 8 renamed: `buttonMode` to `cursor`, `interactive` to `eventMode`, `name` to `label`, `uvRespectAnchor` to `applyAnchorToTexture`, the event names such as `click` and `pointerdown` to `onclick` and `onpointerdown`, and `mousemove`, `pointermove` and `touchmove` to `onglobalmousemove`, `onglobalpointermove` and `onglobaltouchmove`, which run on every move as the 2.x move props did. In development each translated prop warns once and names the replacement. When both the old and the PixiJS 8 prop are passed, the PixiJS 8 prop wins. PixiJS 4 and 5 apps use `compat/pixi6` too. Without the import, `pixi-8` holds no compat code.
- Compat covers props only. A filter is not a display object, so `BlurFilter.blur` (now `strength`) still logs PixiJS's own deprecation warning.

Moved from the PixiJS 7 playground to PixiJS 8 with `compat` from `@react-pixi-fiber/pixi-8/compat/pixi6`, the Sprite, Events and Point-like props examples work after these changes:

- `Texture.from(url)` followed by `.baseTexture` becomes `await Assets.load(url)` and `new Texture({ frame, source })`.
- `BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST` becomes `TextureSource.defaultOptions.scaleMode = "nearest"`.
- A `usePixiTicker` callback reads `ticker.deltaTime`.
- The Bunnymark, Bunnymark with custom components and Suspense examples still use the PixiJS 7 texture calls (`Texture.from(url)`, `Texture.fromURL`) and need the same change.
- The Layers example depends on `@pixi/layers`, which supports PixiJS 7 only.

## Usage

<details open>
  <summary>
    <strong>With ReactDOM (React 18 and 19)</strong>
  </summary>

```jsx harmony
import { createRoot } from "react-dom/client";
import { Sprite, Stage } from "react-pixi-fiber";
import bunny from "./bunny.png";

function Bunny (props) {
  return <Sprite texture={PIXI.Texture.from(bunny)} {...props} />;
}

const container = document.getElementById("container");
const root = createRoot(container);

root.render(
  <Stage options={{ backgroundColor: 0x10bb99, height: 600, width: 800 }}>
    <Bunny x={200} y={200} />
  </Stage>,
);
```

This example will render [`PIXI.Sprite`] object into a [Root Container] of [`PIXI.Application`] on the page.

The HTML-like syntax; [called JSX](https://reactjs.org/docs/introducing-jsx.html) is not required to use with this renderer, but it makes code more readable. You can use [Babel](https://babeljs.io/) with a [React preset](https://babeljs.io/docs/plugins/preset-react/) to convert JSX into native JavaScript.
</details>

---

<details>
  <summary>
    <strong>With ReactDOM (React 17)</strong>
  </summary>

Configure `@react-pixi-fiber/react-17` first, as in [Setup](#setup). React 16 is not supported.

```jsx harmony
import { render } from "react-dom";
import { Sprite, Stage } from "react-pixi-fiber";
import bunny from "./bunny.png";

function Bunny(props) {
  return <Sprite texture={PIXI.Texture.from(bunny)} {...props} />;
}

const container = document.getElementById("container");
render(
  <Stage options={{ backgroundColor: 0x10bb99, height: 600, width: 800 }}>
    <Bunny x={200} y={200} />
  </Stage>,
  container
);
```

This example will render [`PIXI.Sprite`] object into a [Root Container] of [`PIXI.Application`] on the page.

The HTML-like syntax; [called JSX](https://reactjs.org/docs/introducing-jsx.html) is not required to use with this renderer, but it makes code more readable. You can use [Babel](https://babeljs.io/) with a [React preset](https://babeljs.io/docs/plugins/preset-react/) to convert JSX into native JavaScript.
</details>

---

<details>
  <summary>
    <strong>Without ReactDOM</strong>
  </summary>

```jsx harmony
import { render, Text } from "react-pixi-fiber";
import * as PIXI from "pixi.js";

// Setup PixiJS Application
const canvasElement = document.getElementById("container")
const app = new PIXI.Application({
  backgroundColor: 0x10bb99,
  view: canvasElement,
  width: 800,
  height: 600,
});

render(
  <Text text="Hello World!" x={200} y={200} />, 
  app.stage
);
```

This example will render [`PIXI.Text`] object into a [Root Container] of PIXI Application (created as `app`) inside the `<canvas id="container"></canvas>` element on the page.
</details>


## Running Examples

The playgrounds live in [`apps/playground-pixi8`](../../apps/playground-pixi8) and [`apps/playground-pixi7`](../../apps/playground-pixi7) of the [repository](https://github.com/michalochman/react-pixi-fiber) and use the local `react-pixi-fiber` package.

1. Run `pnpm install` in the repository root.
2. Run `pnpm build` in the repository root. The playgrounds load the built files, so rebuild after changing the package source.
3. Run `pnpm start` in the repository root. It starts the dev servers of all the playgrounds.
4. Open one of the URLs that the command prints.


## API

### Components

React Pixi Fiber supports the following components out of the box (but read [Custom Components](#custom-components) section if you need more):

#### `<Stage />`

Renders [Root Container] of any [`PIXI.Application`].

Expects **one** the following props:
* `app` - pass your own [`PIXI.Application`] instance,
* `options` - pass only the [`PIXI.Application`] options.

`onInit(app)` is called once the application exists and the children are rendered.

`bridgeContexts` lists React contexts provided around `<Stage />` that its children can read, see [Context – Using a context provided outside `Stage`](#context--using-a-context-provided-outside-stage).

#### Tags

Each tag names a display object concept. The configured PixiJS adapter creates the matching class of your PixiJS version; every adapter implements all 13 tags.

A display object is an object in the scene graph: a `PIXI.DisplayObject` on PixiJS 4 to 7, a `PIXI.Container` on PixiJS 8, which has no `DisplayObject`. The API names that contain `DisplayObject`, for example `applyDisplayObjectProps` and `DisplayObjectProps`, keep the 2.x names on every PixiJS version.

| Tag | Renders |
| --- | --- |
| `<AnimatedSprite />` | an animated sprite, `PIXI.AnimatedSprite` |
| `<BitmapText />` | bitmap font text, [`PIXI.BitmapText`] |
| `<Container />` | a container, [`PIXI.Container`] |
| `<Graphics />` | vector graphics, [`PIXI.Graphics`] |
| `<Mesh />` | a mesh from `geometry` and `shader`, `PIXI.Mesh`; on PixiJS 4 the texture mesh, like `<MeshSimple />` |
| `<MeshPlane />` | a textured plane mesh |
| `<MeshRope />` | a textured rope mesh |
| `<MeshSimple />` | a simple textured mesh from `texture`, `vertices`, `uvs` and `indices` |
| `<NineSliceSprite />` | a nine-slice scaled sprite |
| `<ParticleContainer />` | a fast container for many sprites, [`PIXI.ParticleContainer`]; on PixiJS 8 it takes `<Particle>` children, see [PixiJS 8](#pixijs-8) |
| `<Sprite />` | a sprite, [`PIXI.Sprite`] |
| `<Text />` | canvas text, [`PIXI.Text`] |
| `<TilingSprite />` | a repeating texture, [`PIXI.TilingSprite`] |

For code that runs on every PixiJS version, use `<MeshSimple texture vertices uvs indices />`. `<Mesh />` takes `geometry` and `shader` on PixiJS 5 and later, and is the texture mesh on PixiJS 4.

### Props

ReactPixiFiber does not ignore unknown display object members – they are all set on the instance as-is, and
an unknown name is not reported.


#### Default props per tag

The PixiJS adapter's `defaults` option sets default props per tag, like React's `defaultProps`:

```js
configure({ react: react18(), pixi: pixi6({ defaults: { Sprite: { alpha: 0.5 }, Text: { text: "" } } }) });

<Sprite texture={texture} />; // alpha 0.5
<Sprite texture={texture} alpha={1} />; // alpha 1
```

- **When the instance is created**, a prop that is missing or `undefined` gets its default. `create` receives it, so a
  prop the constructor reads, such as `Text` `text`, sees it too, and so does a component's own `applyProps`.
- **When a prop is removed** or set to `undefined` (or to an invalid value), it returns to its default. A prop with no
  entry returns to the value the instance had before React Pixi Fiber first set it.
- An explicit `null` is not replaced: it is set as `null`.
- Entries are keyed by the tag as you write it, `PIXIComponent` tags included, and by the prop names of the adapter.
  A tag an adapter adds under its PixiJS class name is a tag of its own, see
  [Adapter tags are recorded under their own name](#adapter-tags-are-recorded-under-their-own-name).


#### Custom Props / Plugins

In case you are using PixiJS plugins, such as [`pixi-layers`](https://github.com/pixijs/pixi-layers), their props are set on the instance like any other prop. To have them checked in development, register them with `PIXIProperty`:

`PIXIProperty(maybeComponentType, propertyName, validator)` accepts:
* `maybeComponentType` – a ReactPixiFiber component or tag, an array of them, or `undefined`/`null`. Passing `undefined` or `null` will apply custom property to all ReactPixiFiber components.
* `propertyName` – a name of the custom property as string. ReactPixiFiber will also check that the casing is correct.
* `validator` – optional function that will be called with value provided and should return `true` if the value is valid, `false` otherwise.

The checks run in development under a `<StrictMode>` inside `Stage` (or inside the tree passed to `render`) and report warnings, not errors.

For example:

```jsx
import { Container, PIXIProperty, Sprite } from "react-pixi-fiber";

const group = new PIXI.display.Group(0, true);

// check only the casing of the name
PIXIProperty(Container, "parentGroup");
PIXIProperty(undefined, "zIndex");

// also check the values that are provided
PIXIProperty(Container, "parentGroup", value => value instanceof PIXI.display.Group);
PIXIProperty([Container, Sprite], "zIndex", value => Number.isFinite(value));

function App() {
  return (
    <Container>
      <Container parentGroup={group}>
        <Sprite texture={PIXI.Texture.WHITE} x={10} y={10} zIndex={1} />
        <Sprite texture={PIXI.Texture.WHITE} x={15} y={15} zIndex={2} />
      </Container>
      {/* `parentgroup` below will trigger prop warning, as the letter casing is incorrect */}
      <Container parentgroup={group}>
        <Sprite texture={PIXI.Texture.WHITE} x={100} y={100} zIndex={1} />
        {/* `zindex` below will trigger prop warning, as the letter casing is incorrect */}
        <Sprite texture={PIXI.Texture.WHITE} x={105} y={105} zindex={2} />
      </Container>
    </Container>
  )
}
```


#### Setting values for Point and ObservablePoint types

For setting properties on PixiJS types that are either [`PIXI.Point`]s or [`PIXI.ObservablePoint`]s you can use either 
and array of integers or a comma-separated string of integers in the following forms: `[x,y]`, `"x,y"`, `[i]`, `"i"`. 

In the case where two integers are provided, the first will be applied to the `x` coordinate and the second will be 
applied to the `y` coordinate. In the case where a single integer if provided, it will be applied to both coordinates.

You can still create your own PIXI `Point` or `ObservablePoint` objects and assign them directly to the property. 
These won't actually replace the property but they will be applied using the original object's `.copy()` method.

### Context – Accessing `PIXI.Application` instance created by `<Stage />`

`PIXI.Application` is automatically provided using the following definition (either as a prop or in context):
* `app` – an instance of PixiJS Application, with properties like:
  * `loader` – Loader instance to help with asset loading (PixiJS 6; PixiJS 7 and 8 have `Assets`),
  * `renderer` – WebGL or CanvasRenderer,
  * `ticker` – Ticker for doing render updates,
  * `view` – reference to the renderer's canvas element. 

<details>
  <summary>
    <strong>Using <code>withApp</code> Higher-Order Component</strong>
  </summary>

To get `app` prop in your component you may wrap it with `withApp` higher-order component:

```jsx harmony
import { render } from "react-dom";
import { Sprite, Stage, withApp } from "react-pixi-fiber";
import bunny from "./bunny.png";

class RotatingBunny extends Component {
  state = {
    rotation: 0,
  };

  componentDidMount() {
    // Note that `app` prop is coming through `withApp` HoC
    this.props.app.ticker.add(this.animate);
  }

  componentWillUnmount() {
    this.props.app.ticker.remove(this.animate);
  }

  animate = delta => {
    this.setState(state => ({
      rotation: state.rotation + 0.1 * delta,
    }));
  };

  render() {
    return (
      <Sprite 
        {...this.props}
        texture={PIXI.Texture.from(bunny)}
        rotation={this.state.rotation} 
      />
    );
  }
}
RotatingBunny.propTypes = {
  app: PropTypes.object.isRequired,
};

const RotatingBunnyWithApp = withApp(RotatingBunny);

render(
  <Stage options={{ backgroundColor: 0x10bb99, height: 600, width: 800 }}>
    <RotatingBunnyWithApp x={200} y={200} />
  </Stage>,
  document.getElementById("container")
);
```

</details>

---

<details>
  <summary>
    <strong>Using <code>AppContext</code> directly</strong>
  </summary>

```jsx harmony
import { render } from "react-dom";
import { AppContext, Sprite, Stage } from "react-pixi-fiber";
import bunny from "./bunny.png";

class RotatingBunny extends Component {
  state = {
    rotation: 0,
  };

  componentDidMount() {
    // Note that `app` prop is coming directly from AppContext.Consumer
    this.props.app.ticker.add(this.animate);
  }

  componentWillUnmount() {
    this.props.app.ticker.remove(this.animate);
  }

  animate = delta => {
    this.setState(state => ({
      rotation: state.rotation + 0.1 * delta,
    }));
  };

  render() {
    return (
      <Sprite 
        {...this.props}
        texture={PIXI.Texture.from(bunny)}
        rotation={this.state.rotation} 
      />
    );
  }
}
RotatingBunny.propTypes = {
  app: PropTypes.object.isRequired,
};

render(
  <Stage options={{ backgroundColor: 0x10bb99, height: 600, width: 800 }}>
    <AppContext.Consumer>
      {app => (
        <RotatingBunny app={app} x={200} y={200} />
      )}
    </AppContext.Consumer>
  </Stage>,
  document.getElementById("container")
);
```

</details>

---

### Context – Using a context provided outside `Stage`

React does not pass context between renderers, and the children of `<Stage />` render in their own React root. A provider around `<Stage />` is not visible inside it, so `useContext`, `react-redux` `connect` and similar read the default value there.

Pass the contexts to bridge in `bridgeContexts`. `<Stage />` reads each one where it renders and provides it again inside, and renders the children again when a value changes:

```jsx harmony
import { createContext, useContext } from "react";
import { Sprite, Stage } from "react-pixi-fiber";

const ThemeContext = createContext("light");

function ThemedSprite() {
  const theme = useContext(ThemeContext);
  return <Sprite tint={theme === "dark" ? 0x333333 : 0xffffff} />;
}

function App({ theme }) {
  return (
    <ThemeContext.Provider value={theme}>
      <Stage bridgeContexts={[ThemeContext]} options={{ height: 600, width: 800 }}>
        <ThemedSprite />
      </Stage>
    </ThemeContext.Provider>
  );
}
```

Keep the number of contexts the same across renders, as with hooks: a change remounts the application. The standalone `render` has no React tree around it, so it cannot bridge; provide the contexts inside the rendered element instead.

### Custom Components

`PIXIComponent(type, behavior)` registers a component under the `type` string and returns it. `behavior` is an object with the following 4 properties.

#### `create(props)`

Use this to create the display object.

This is your entry point to custom components and the only required method.

#### `applyProps(displayObject, oldProps, newProps)` (optional)

Use this to apply `newProps` to your `Component` in a custom way. `oldProps` is `undefined` on the first render.

Note: this replaces the default method of transferring `props` to the specified `displayObject`. Call `this.applyDisplayObjectProps(oldProps, newProps)` inside your `applyProps` method if you want that.

#### `afterAdd(displayObject)` (optional)

Use this to do something after `displayObject` is added to its parent. It runs once per add: when React reorders a child within the same parent, neither `afterAdd` nor `beforeRemove` runs, so listeners added here and removed in `beforeRemove` are never doubled.

#### `beforeRemove(displayObject)` (optional)

Use this to do something (usually cleanup) before `displayObject` is removed from its parent.

#### Simple Graphics example

For example, this is how you could implement `Rectangle` component:
```javascript
// components/Rectangle.js
import { PIXIComponent } from "react-pixi-fiber";
import * as PIXI from "pixi.js";

export default PIXIComponent("Rectangle", {
  create: props => new PIXI.Graphics(),
  applyProps: function (instance, oldProps, newProps) {
    const { fill, x, y, width, height } = newProps;
    instance.clear();
    instance.beginFill(fill);
    instance.drawRect(x, y, width, height);
    instance.endFill();
  },
});
```

```jsx harmony
// App.js
import { render } from "react-pixi-fiber";
import * as PIXI from "pixi.js";
import Rectangle from "./components/Rectangle";

// `configure` has run in the app entry, see Setup
const app = new PIXI.Application({
  view: document.getElementById("container"),
  width: 800,
  height: 600,
});

render(
  <Rectangle
    x={250}
    y={200}
    width={300}
    height={200}
    fill={0xFFFF00}
  />,
  app.stage
);
```

## Testing


## Caveats


## FAQ

### Is it production ready?

Yes and it's awesome! It is battle tested and backed up by [Kalamba Games](https://kalambagames.com/games/) since the conception in the beginning of 2018 (after [migrating from `react-pixi`](#migrating-from-react-pixi)) and now also used by other game studios.

### What version of PixiJS I can use?

The one your PixiJS adapter supports, see the adapter table in [Setup](#setup).

### Can I use it in my TypeScript project?

Sure thing! We've got you covered.

### Can I use already existing [`PIXI.Application`]?

Yes, you can pass `app` property to `Stage` component, e.g. `<Stage app={app} />`.

Two `Stage` components sharing one `app` are not supported: both render into `app.stage`, so the second replaces the first's children and unmounting either empties both.

### What does `unmount` return?

`unmount(container)` never throws. It returns `true` for a container that was rendered into (calling it again is a no-op that returns `true`) and `false`, with a warning in development, for a container that never was.

### Can I migrate from `react-pixi-fiber@0.x.y`?

Yes, read [migration guide](#migrating-from-react-pixi-fiber0xy-before-version-100).

### Can I migrate from `react-pixi-fiber@2.x`?

Yes, read [migration guide](#migrating-to-300).

### Can I migrate from `react-pixi`?

Yes, it is easy, read [migration guide](#migrating-from-react-pixi).

### Is server-side rendering supported?

No, unfortunately it is not supported right now.


## Migrating from `react-pixi-fiber@0.x.y` (before version `1.0.0`)

These notes describe the move to 1.0.0. Code that follows them also needs [Migrating to 3.0.0](#migrating-to-300): `Stage` is a function component and `createStageClass` is deprecated, `ref.current._app.current` is `null` until `onInit`, `CustomPIXIComponent` and the `custom*` behavior keys are deprecated, and `_customApplyProps` is gone, `applyProps(instance, oldProps, newProps)` replaces the code in the last note.

<details>
  <summary>
    <strong>Changed built-in <code>Stage</code> and the one returned by <code>createStageClass()</code> to have the same API</strong>
  </summary>

It is now possible to get `ref` to built-in `Stage`.

Unless you are using class-based `Stage` component explicitly in your application, for example you are extending it, you should prefer to use built-in `Stage` instead of creating it with `createStageClass()`.

Data available on the `Stage` "instance":
* `_app` - PIXI.Application instance
* `_canvas` - HTMLCanvasElement instance
* `props` - props passed to Stage component

For example:
```js
import * as React from "react";
import { Stage, Text } from "react-pixi-fiber";

const width = 600;
const height = 400;
const options = {
  backgroundColor: 0x56789a,
  width: width,
  height: height
};
const style = {
  width: width,
  height: height
};

function App() {
  const stageRef = React.useRef()
  React.useEffect(() => {
    // Access PIXI.Application instance
    console.log(stageRef.current?._app.current)
    // Access HTMLCanvasElement instance
    console.log(stageRef.current?._canvas.current)
    // Access props passed to Stage component
    console.log(stageRef.current?.props)
  }, [])

  return (
    <Stage options={options} style={style} ref={stageRef}>
      <Text x={100} y={100} text="Hello world!" />
    </Stage>
  );
}
```
</details>

---

<details>
  <summary>
    <strong>Changed <code>PIXI.Application</code> exposed by <code>Stage</code> to be React <code>ref</code></strong>
  </summary>

This is only relevant if you were using `createStageClass()` to create `Stage` component, as it was impossible to get `ref` when using built-in `Stage` as if was a function component, which triggered `Warning: Function components cannot be given refs` error.

For example:
```diff
import * as React from "react";
import { createStageClass, Text } from "react-pixi-fiber";

const Stage = createStageClass()

const width = 600;
const height = 400;
const options = {
  backgroundColor: 0x56789a,
  width: width,
  height: height
};
const style = {
  width: width,
  height: height
};

function App() {
  const stageRef = React.useRef()
  React.useEffect(() => {
-    console.log(stageRef.current?._app.renderer)
+    console.log(stageRef.current?._app.current.renderer)
  }, [])

  return (
    <Stage options={options} style={style} ref={stageRef}>
      <Text x={100} y={100} text="Hello world!" />
    </Stage>
  );
}
```
</details>

---

<details>
  <summary>
    <strong>Changed <code>oldProps</code> in <code>customApplyProps</code> to not be initialised when the component is first rendered</strong>
  </summary>

Make sure to check if `oldProps` is initialised before trying to read properties from it.

For example:
```diff
import { Container, CustomPIXIComponent } from "react-pixi-fiber"

const TYPE = "CustomContainer"
const behavior = {
  customApplyProps: function (instance, oldProps, newProps) {
-    const { customProp: oldCustomProp, ...otherOldProps } = oldProps
+    const { customProp: oldCustomProp, ...otherOldProps } = oldProps ?? {}
    const { customProp, ...otherNewProps } = newProps
    if (customProp !== oldCustomProp) {
      // Do something when customProp value have changed
    }
    this.applyDisplayObjectProps(otherOldProps, otherNewProps)
  },
  customDisplayObject: function ({ customProp, ...props }) {
    const container = new PIXI.Container(props)
    if (customProp === "foo") {
      // Do something when customProp is equal to "foo"
    }
    return container
  },
}

export default CustomPIXIComponent(behavior, TYPE)
```
</details>

---

<details>
  <summary>
    <strong>Changed <code>applyProps</code> to <code>applyDisplayObjectProps</code></strong>
  </summary>


`react-pixi-fiber` now needs to know the type of component (e.g. `"Sprite"`) to properly apply the props.

For example:
```diff
-import { applyProps } from "react-pixi-fiber"
+import { applyDisplayObjectProps } from "react-pixi-fiber"

function ApplyAnimatedValues(instance, props) {
  if (instance instanceof PIXI.DisplayObject) {
-    applyProps(instance, {}, props)
+    // Component has custom way of applying props - use that
+    if (typeof instance._customApplyProps === "function") {
+      instance._customApplyProps(instance, {}, props)
+    }
+    // Component doesn't have custom way of applying props - use default way
+    else {
+      const type = instance.constructor.name
+      applyDisplayObjectProps(type, instance, {}, props)
    }
  } else {
    return false
  }
}
```

Refer to the implementation, when in doubt:
* old `applyProps` -> https://github.com/michalochman/react-pixi-fiber/blob/64e8e9f991f51b407f3af108da732e186429454a/src/ReactPixiFiber.js#L43
* new `applyDisplayObjectProps` -> https://github.com/michalochman/react-pixi-fiber/blob/3a9b71b8d18180117bf70459dd6b4419c5ef1c21/src/ReactPixiFiberComponent.js#L161
</details>

---

## Migrating from `react-pixi`

React Pixi Fiber covers the `react-pixi` API with named exports. The `react-pixi-fiber/react-pixi-alias` drop-in subpath was removed in 3.0.0, so import from `react-pixi-fiber` and drop any `react-pixi` bundler alias.

```jsx
// react-pixi
import ReactPIXI from "react-pixi";
const { Stage, DisplayObjectContainer, Sprite } = ReactPIXI;
ReactPIXI.render(<Stage width={800} height={600}>…</Stage>, element);

// react-pixi-fiber
import { createRoot } from "react-dom/client";
import { Stage, Container, Sprite } from "react-pixi-fiber";
createRoot(element).render(<Stage options={{ width: 800, height: 600 }}>…</Stage>);
```

`DisplayObjectContainer` is `Container`, and `CustomPIXIComponent` is `PIXIComponent` (see [Migrating to 3.0.0](#migrating-to-300)). `ReactPIXI.factories` has no equivalent.

---

## Migrating to 3.0.0

Every change is listed in the [changelog](./CHANGELOG.md). These are the ones that need a code change.

### Call `configure` once

```js
// 2.x
import { Stage, Sprite } from "react-pixi-fiber";
// 3.0.0, in the app entry, before the first render
import { configure } from "react-pixi-fiber";
import react18 from "@react-pixi-fiber/react-18";
import pixi6 from "@react-pixi-fiber/pixi-6";

configure({ react: react18(), pixi: pixi6() });
```

The core no longer depends on `react-reconciler` or `pixi.js`; the adapters bring them. Install the adapters from the table in [Setup](#setup). Components keep importing from `react-pixi-fiber`. Without `configure`, the first `Stage` mount, `render` call or created instance throws, on React 18:

```
react-pixi-fiber is not configured. Install the adapters for your React and PixiJS versions and call `configure` once, before the first render:

  npm install @react-pixi-fiber/react-18 @react-pixi-fiber/pixi-N

  import { configure } from "react-pixi-fiber";
  import react18 from "@react-pixi-fiber/react-18";
  import pixiN from "@react-pixi-fiber/pixi-N";

  configure({ react: react18(), pixi: pixiN() });

Replace N with your PixiJS major version (4 to 8).
```

Call it once. A second call after a render warns in development: trees already rendered keep their React renderer, new PixiJS instances and prop writes use the new adapters.

### `CustomPIXIComponent` is `PIXIComponent`

```js
// 2.x
const Circle = CustomPIXIComponent(
  {
    customDisplayObject: props => new PIXI.Graphics(),
    customApplyProps: (instance, oldProps, newProps) => { /* draw */ },
    customDidAttach: instance => {},
    customWillDetach: instance => {},
  },
  "Circle"
);
CustomPIXIProperty("Circle", "radius", value => typeof value === "number");
// 3.0.0
const Circle = PIXIComponent("Circle", {
  create: props => new PIXI.Graphics(),
  applyProps: (instance, oldProps, newProps) => { /* draw */ },
  afterAdd: instance => {},
  beforeRemove: instance => {},
});
PIXIProperty("Circle", "radius", value => typeof value === "number");
```

The type comes first and the behavior keys are `create`, `applyProps`, `afterAdd` and `beforeRemove`. The TypeScript types lose the `Custom` prefix: `CustomPIXIComponentBehavior` is `PIXIComponentBehavior`, `CustomDisplayObjectPropSetter` is `DisplayObjectPropSetter`, and so on. The 2.x names, argument order and keys keep working in 3.x with a development warning and are removed in 4.0.0.

The behavior is read with `{ ...behavior }`, so only its own properties count. A behavior that is a class instance must set its functions as own properties, methods on the prototype are not found.

### Re-apply props from a higher-order component with `applyProps`

```js
// 2.x, for example an `animated` binding
if (typeof instance._customApplyProps === "function") instance._customApplyProps(instance, {}, props);
else applyDisplayObjectProps(instance.constructor.name, instance, {}, props);
// 3.0.0
import { applyProps } from "react-pixi-fiber";
applyProps(instance, {}, props);
```

`_customApplyProps`, `_customDidAttach` and `_customWillDetach` are no longer set on the display object. `applyProps` works for every instance React Pixi Fiber created, built-in or custom, and `getInstanceTag(instance)` returns its tag.

### Read the application in `onInit`, not from the ref at mount

```jsx
// 2.x
<Stage ref={ref} />;  useEffect(() => { ref.current._app.current.ticker.add(tick); }, []);
// 3.0.0
<Stage onInit={app => app.ticker.add(tick)} />
```

`Stage` creates the application asynchronously and renders its children after it commits. `ref.current._app.current` is `null` until then, and reading it early warns in development. `onInit(app)` runs once the application exists and the children are rendered, and again with the new application when an `options` change recreates it.

Tests that check what `Stage` rendered right after `act()` need an async `act`:

```js
// 2.x
act(() => { renderer = create(<Stage><Sprite /></Stage>); });
// 3.0.0
await act(async () => { renderer = create(<Stage><Sprite /></Stage>); });
```

### `createStageClass` returns the function `Stage`

```js
// 2.x
const Stage = createStageClass();
// 3.0.0
import { Stage } from "react-pixi-fiber";
```

`Stage` is no longer a class component. `createStageClass()` returns the function `Stage` with a development warning and is removed in 4.0.0. `Stage` has no `defaultProps`, so `ref.current.props.options` is `undefined` when `options` is not passed.

### No UMD build, no `prop-types`

```html
<!-- 2.x -->
<script src="https://unpkg.com/react-pixi-fiber/umd/react-pixi-fiber.production.min.js"></script>
```

```js
// 3.0.0: install and import the package through a bundler
import { Stage, Sprite } from "react-pixi-fiber";
```

`prop-types` is no longer a peer dependency and props are not checked with it. Remove it from your dependencies if nothing else uses it.

### The `react-pixi-alias` subpath is removed

```js
// 2.x
import ReactPIXI from "react-pixi-fiber/react-pixi-alias";
// webpack: resolve: { alias: { "react-pixi$": "react-pixi-fiber/react-pixi-alias" } }
// 3.0.0
import { Stage, Container, Sprite } from "react-pixi-fiber";
```

Drop the alias from your build and test config. See [Migrating from `react-pixi`](#migrating-from-react-pixi) for the names.

### Prop validation warnings under `<StrictMode>`

```jsx
<Stage>
  <StrictMode>
    <Container buttonmode />
  </StrictMode>
</Stage>
// 2.x on React 18: no warning
// 3.0.0 in development: warns that `buttonmode` should be `buttonMode`
```

Development prop validation runs only under a `<StrictMode>` inside `Stage` (or inside the tree passed to `render`). On React 18 and 19 it never ran in 2.x, because the library checked React 17's mode bit. You may see new warnings for casing, wrong value types and `PIXIProperty` validators. They are warnings, not errors.

### Unknown props are set on the instance

```jsx
<Container sortableChildren zIndex={2} textur={texture} />
// 2.x: `sortableChildren` was dropped (untyped boolean), `textur` was reported in development
// 3.0.0: all three are set on the PIXI.Container, nothing is reported
```

A prop name the library does not type is set as-is, like `@pixi/react` does, so a typo is not reported. A boolean or function value on such a name is set instead of dropped.

### New tags `AnimatedSprite`, `Mesh`, `MeshSimple`, `MeshPlane`, `MeshRope`, `NineSliceSprite`

```jsx
// 2.x
const AnimatedSprite = CustomPIXIComponent(props => new PIXI.AnimatedSprite(props.textures), "AnimatedSprite");
// 3.0.0
import { AnimatedSprite } from "react-pixi-fiber";
<AnimatedSprite textures={textures} />
```

A component you register under one of these names keeps winning over the built-in tag, with a development warning. Rename your component or remove it and use the built-in one.

### Pass the `Stage` size in `options`

```jsx
// 2.x and 3.0.0: sets `app.stage.width` and `app.stage.height`, the renderer keeps its default size
<Stage width={800} height={600} />
// 3.0.0: sizes the renderer and the canvas
<Stage options={{ width: 800, height: 600 }} />
```

The renderer size comes only from `options.width` and `options.height`, in 2.x and in 3.0.0. The `width` and `height` props never sized the renderer and never reached the `<canvas>` element: both versions set them on `app.stage`, the root `PIXI.Container`, which scales its content. 3.0.0 does the same and warns in development. The props are removed in 4.0.0.

### `NineSlicePlane` is `NineSliceSprite`

```jsx
// 2.x
<NineSlicePlane texture={texture} leftWidth={10} />
// 3.0.0
<NineSliceSprite texture={texture} leftWidth={10} />
```

`NineSlicePlane` keeps working in 3.x. `@react-pixi-fiber/pixi-6` defines `NineSlicePlane` as its own tag, so it creates a `PIXI.NineSlicePlane` without a warning. With an adapter that does not define it, the core maps it to `NineSliceSprite` with a development warning; the mapping is removed in 4.0.0.

### Adapter tags are recorded under their own name

```js
pixi6({ defaults: { NineSliceSprite: { leftWidth: 10 } } });
PIXIProperty("NineSliceSprite", "leftWidth", value => value >= 0);
// applies to <NineSliceSprite />, not to <NineSlicePlane /> from @react-pixi-fiber/pixi-6
getInstanceTag(nineSlicePlaneInstance); // "NineSlicePlane"
```

The tags an adapter adds under its PixiJS class names, for example `NineSlicePlane`, `SimpleMesh`, `SimplePlane` and `SimpleRope` in `@react-pixi-fiber/pixi-6`, create the same display objects as the core tags, but each is a tag of its own. `defaults` and `PIXIProperty` keyed by the core tag do not apply to them, and `getInstanceTag` returns the tag you wrote. Key them by that tag too, or use the core tag.

### The 2.x interaction types import from the PixiJS adapter

```ts
// 2.x
import type { InteractionCompatibility, InteractionEventCompatibility, PixiTypeFallback } from "react-pixi-fiber";
// 3.0.0, from the PixiJS adapter you configure, here PixiJS 6
import type { InteractionCompatibility, InteractionEventCompatibility, PixiTypeFallback } from "@react-pixi-fiber/pixi-6";
```

| 2.x type from `react-pixi-fiber` | 3.0.0 |
| --- | --- |
| `InteractionCompatibility` | `@react-pixi-fiber/pixi-4`, `pixi-5`, `pixi-6` |
| `InteractionEventCompatibility` | `@react-pixi-fiber/pixi-4`, `pixi-5`, `pixi-6` |
| `InteractiveComponent` | `@react-pixi-fiber/pixi-4`, `pixi-5`, `pixi-6`; still resolves from `react-pixi-fiber`, deprecated |
| `PixiTypeFallback` | `@react-pixi-fiber/pixi-4`, `pixi-5`, `pixi-6`, `pixi-7` |

PixiJS 7 and 8 have no `PIXI.interaction` and no `PIXI.InteractionEvent`, so `pixi-7` and `pixi-8` have no counterpart for the interaction types; type the event handlers with `FederatedPointerEvent` from `pixi.js`. The other 2.x types, for example `PointLike`, `StageProps` and the `Interaction*Events` maps, still import from `react-pixi-fiber`.

### Smaller changes

- A prop set to `undefined` resets to the value the instance had before React Pixi Fiber first set it. For example, `Text` `text` goes back to the value the `PIXI.Text` was created with, not `""`. To choose the value, set it in the adapter's [`defaults`](#default-props-per-tag).
- `Stage` passes typed prop names and Container prop names, for example `buttonMode` and `interactiveChildren`, to `app.stage`. In 2.x these props went to the `<canvas>` element.
- `AppContext` is typed `Context<Application | null>` and its default value is `null`.
- `Graphics` passes `props.geometry` to the `PIXI.Graphics` constructor.
- The fallbacks to the PixiJS 4 `PIXI.extras`, `PIXI.mesh` and `PIXI.particles` namespaces are removed from the core; PixiJS 4 support moves to the `@react-pixi-fiber/pixi-4` adapter.

---

## Contributing

The main purpose of this repository is to be able to render PixiJS objects inside React Fiber architecture.
 
Development of React Pixi Fiber happens in the open on GitHub, and I would be grateful to the community for any contributions, including bug reports and suggestions.

Read below to learn how you can take part in improving React Pixi Fiber.

### [Code of Conduct](../../CODE_OF_CONDUCT.md)
React Pixi Fiber has adopted a Contributor Covenant Code of Conduct that we expect project participants to adhere to. Please read [the full text](../../CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

### [Contributing Guide](../../CONTRIBUTING.md)

Read the contributing guide to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to React Pixi Fiber.

## License

ReactPixiFiber is [MIT licensed](./LICENSE).


## Credits

### [`react-pixi`]

For making PIXI available in React for the first time.

### [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)

For deeply explaining the concepts of Fiber architecture.

### [Building a custom React renderer](https://github.com/nitin42/Making-a-custom-React-renderer)

For helping me understand how to build an actual renderer.

### [React ART](https://github.com/facebook/react/tree/master/packages/react-art)

On which this renderer was initially based.

### [React] Contributors

For making an awesome project structure and documentation that is used in similar fashon here.


[PixiJS]: https://github.com/pixijs/pixi.js
[React]: https://github.com/facebook/react
[Root Container]: https://pixijs.download/v6.5.10/docs/PIXI.Application.html#stage
[`PIXI.Application`]: https://pixijs.download/v6.5.10/docs/PIXI.Application.html
[`PIXI.BitmapText`]: https://pixijs.download/v6.5.10/docs/PIXI.BitmapText.html
[`PIXI.Container`]: https://pixijs.download/v6.5.10/docs/PIXI.Container.html
[`PIXI.Graphics`]: https://pixijs.download/v6.5.10/docs/PIXI.Graphics.html
[`PIXI.ObservablePoint`]: https://pixijs.download/v6.5.10/docs/PIXI.ObservablePoint.html
[`PIXI.ParticleContainer`]: https://pixijs.download/v6.5.10/docs/PIXI.ParticleContainer.html
[`PIXI.Point`]: https://pixijs.download/v6.5.10/docs/PIXI.Point.html
[`PIXI.Sprite`]: https://pixijs.download/v6.5.10/docs/PIXI.Sprite.html
[`PIXI.Text`]: https://pixijs.download/v6.5.10/docs/PIXI.Text.html
[`PIXI.TilingSprite`]: https://pixijs.download/v6.5.10/docs/PIXI.TilingSprite.html
[`react-pixi`]: https://github.com/Izzimach/react-pixi
