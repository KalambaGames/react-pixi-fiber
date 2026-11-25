<div align="center">
  <img alt="ReactPixiFiber" src="./react-pixi.svg" width="500" />
</div>

<div align="center">
  <h1>ReactPixiFiber – React Fiber renderer for PixiJS</h1>

  <p>
    ReactPixiFiber is a JavaScript library for writing <a href="https://pixijs.com/">PixiJS</a> applications using <a href="https://reactjs.org/">React</a> declarative style in React 18 and above.
    <br />
    For React <16.0.0 see <a href="https://github.com/Izzimach/react-pixi">react-pixi</a>.
  </p>

  <a href="https://npmjs.com/package/react-pixi-fiber">
    <img alt="npm" src="https://img.shields.io/npm/v/react-pixi-fiber.svg" />
  </a>
  <a href="https://github.com/michalochman/react-pixi-fiber/blob/master/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/michalochman/react-pixi-fiber.svg" />
  </a>
  <a href="https://circleci.com/gh/michalochman/react-pixi-fiber/tree/master">
    <img alt="CircleCI" src="https://img.shields.io/circleci/project/github/michalochman/react-pixi-fiber/master.svg" />
  </a>
  <a href="https://codecov.io/gh/michalochman/react-pixi-fiber/branch/master">
    <img alt="codecov" src="https://img.shields.io/codecov/c/github/michalochman/react-pixi-fiber/master.svg" />
  </a>
  <a href="
  [![styled with prettier]()](">
    <img alt="styled with prettier" src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" />
  </a>
  <a href="https://gitter.im/react-pixi-fiber/Lobby">
    <img alt="gitter" src="https://img.shields.io/gitter/room/react-pixi-fiber/Lobby.svg" />
  </a>
</div>

> **Looking for 3.x, or for the latest React and PixiJS?** Version 3 is on the
> [`master`](https://github.com/KalambaGames/react-pixi-fiber) branch and on npm as `react-pixi-fiber@latest`.
> To upgrade, read
> [Migrating to 3.0.0](https://github.com/KalambaGames/react-pixi-fiber/blob/master/packages/react-pixi-fiber/README.md#migrating-to-300).
> This branch (`2.x`) is the 2.x line and takes bug fixes only.

## Demo

See [Rotating Bunny](https://codesandbox.io/s/q7oj1p0jo6) demo.

Also, please explore our [CodeSandbox](https://codesandbox.io/) templates:
* [Hello world using JavaScript](https://codesandbox.io/s/react-pixi-fiber-template-ohk6z)
* [Hello world using TypeScript](https://codesandbox.io/s/react-pixi-fiber-typescript-template-613ly)

and examples:
* [Rotating Bunny](https://codesandbox.io/s/q7oj1p0jo6)
* [AnimatedSprite using CustomComponent](https://codesandbox.io/s/react-pixi-fiber-demo-animatedsprite-d6udu)
* [Aligning texts](https://codesandbox.io/s/react-pixi-fiber-text-alignment-th5eg)
* [Sharing Redux state](https://codesandbox.io/s/react-pixi-fiber-with-redux-g4k7n)
* [Using animated](https://codesandbox.io/s/9qyxrljyo)


## 🚀 Migrating from version `0.x.y`? 🚀

Read [migration guide](#migrating-from-react-pixi-fiber0xy-before-version-100). 

## Installing

The current version assumes [React] >16.0.0 and [PixiJS] >4.4.0

    yarn add react-pixi-fiber prop-types pixi.js

or

    npm install react-pixi-fiber prop-types pixi.js --save

Refer to next sections to see usage examples.

This package works flawlessly with [Create React App](https://github.com/facebookincubator/create-react-app) – see examples below, they already use it.

## Usage

<details open>
  <summary>
    <strong>With ReactDOM (React 18 and above)</strong>
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
    <strong>With ReactDOM (React 16 and 17)</strong>
  </summary>

React 16 and 17 are supported by `react-pixi-fiber@1.x` only. `react-pixi-fiber@2.x` requires React 18.2 or newer.

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

1. Run `npm install` in the repository root.
2. Run `npm install` in the `examples` directory.
3. Run `npm run start` in the `examples` directory.
4. Wait few seconds and browse examples that will open in new browser window.


## Migrating from `react-pixi-fiber@0.x.y` (before version `1.0.0`)

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

It is possible to use React Pixi Fiber as a drop-in replacement for `react-pixi`. 

There are two options:

<details>
  <summary>Changing <code>import</code> or <code>require</code> statements</summary>

Change:

```js
import ReactPIXI from "react-pixi";
// or
const ReactPIXI = require("react-pixi");
```

to:

 ```js
import ReactPIXI from "react-pixi-fiber/react-pixi-alias";
// or
const ReactPIXI = require("react-pixi-fiber/react-pixi-alias");
```
</details>

---

<details>
  <summary>Using <code>webpack</code> resolve <code>alias</code></summary>

```js
resolve: {
  alias: {
    "react-pixi$": "react-pixi-fiber/react-pixi-alias"
  }
}
```
</details>

---

## API

### Components

React Pixi Fiber currently supports following components out of the box (but read [Custom Components](#custom-components) section if you need more):

#### `<Stage />`

Renders [Root Container] of any [`PIXI.Application`].

Expects **one** the following props:
* `app` - pass your own [`PIXI.Application`] instance,
* `options` - pass only the [`PIXI.Application`] options.

#### `<Container />`

Renders [`PIXI.Container`].

#### `<Graphics />`

Renders [`PIXI.Graphics`].

#### `<ParticleContainer />`

Renders [`PIXI.ParticleContainer`] (or [`PIXI.particles.ParticleContainer`] if you're using PixiJS 4).

#### `<Sprite />`

Renders [`PIXI.Sprite`].

#### `<TilingSprite />`

Renders [`PIXI.TilingSprite`] (or [`PIXI.extras.TilingSprite`] if you're using PixiJS 4).

#### `<Text />`

Renders [`PIXI.Text`].

#### `<BitmapText />`

Renders [`PIXI.BitmapText`] (or [`PIXI.extras.BitmapText`] if you're using PixiJS 4).

#### `<NineSlicePlane />`

Renders [`PIXI.NineSlicePlane`].

### Props

[Similarly](https://reactjs.org/blog/2017/09/08/dom-attributes-in-react-16.html) to ReactDOM in React 16,
ReactPixiFiber is not ignoring unknown [`PIXI.DisplayObject`] members – they are all passed through. You can read
more about [Unknown Prop Warning](https://reactjs.org/warnings/unknown-prop.html) in ReactDOM.


#### Custom Props / Plugins

In case you are using PixiJS plugins, such as [`pixi-layers`](https://github.com/pixijs/pixi-layers), ReactPixiFiber can
recognize these custom props by using the following `CustomPIXIProperty` API:

`CustomPIXIProperty(maybeComponentType, propertyName, validator)` accepts:
* `maybeComponentType` – a ReactPixiFiber component, an array of ReactPixiFiber components or `undefined`/`null`. Passing `undefined` or `null` will apply custom property to all ReactPixiFiber components.
* `propertyName` – a name of the custom property as string. ReactPixiFiber will also check that the casing is correct.
* `validator` – optional function that will be called with value provided and should return `true` if the value is valid, `false` otherwise.

For example:

```js
import { Container, Sprite } from "react-pixi-fiber";

const group = new PIXI.display.Group(0, true);

// if you just want to get rid of Unknown Prop Warning:
CustomPIXIProperty(Container, "parentGroup");
CustomPIXIProperty(undefined, "zIndex");

// if you want to be strict in the values that are provided
CustomPIXIProperty(Container, "parentGroup", value => value instanceof PIXI.display.Group);
CustomPIXIProperty([Container, Sprite], "zIndex", value => Number.isFinite(value));

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
  * `loader` – Loader instance to help with asset loading,
  * `renderer` – WebGL or CanvasRenderer,
  * `ticker` – Ticker for doing render updates,
  * `view` – reference to the renderer's canvas element. 

<details>
  <summary>
    <strong>Using <code>withApp</code> Higher-Order Component (with all React versions)</strong>
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
    <strong>Using New Context API directly (with React 16.3.0 and newer)</strong>
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

<details>
  <summary>
    <strong>Using Legacy Context API directly (with React older than 16.3.0)</strong>
  </summary>

This approach is not recommended as it is easier to just use `withApp` HoC mentioned above.

```jsx harmony
import { render } from "react-dom";
import { Sprite, Stage } from "react-pixi-fiber";
import bunny from "./bunny.png";

class RotatingBunny extends Component {
  state = {
    rotation: 0,
  };

  componentDidMount() {
    // Note that `app` is coming from context, NOT from props
    this.context.app.ticker.add(this.animate);
  }

  componentWillUnmount() {
    this.context.app.ticker.remove(this.animate);
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
// Note that here we tell React to apply `app` via legacy Context API
RotatingBunny.childContextTypes = {
  app: PropTypes.object,
};

render(
  <Stage options={{ backgroundColor: 0x10bb99, height: 600, width: 800 }}>
    <RotatingBunny x={200} y={200} />
  </Stage>,
  document.getElementById("container")
);
```

</details>

---

### Custom Components

ReactPixiFiber can recognize your custom components using API compatible with `react-pixi`.

`CustomPIXIComponent(behavior, type)` accepts a `behavior` object with the following 4 properties and a `type` string.

#### `customDisplayObject(props)`

Use this to create an instance of [PIXI.DisplayObject]. 

This is your entry point to custom components and the only required method. Can be also passed as `behavior` of type `function` to `CustomPIXIComponent`.

#### `customApplyProps(displayObject, oldProps, newProps)` (optional)

Use this to apply `newProps` to your `Component` in a custom way.

Note: this replaces the default method of transfering `props` to the specified `displayObject`. Call `this.applyDisplayObjectProps(oldProps,newProps)` inside your `customApplyProps` method if you want that.

#### `customDidAttach(displayObject)` (optional)

Use this to do something after `displayObject` is attached, which happens **after** `componentDidMount` lifecycle method.

#### `customWillDetach(displayObject)` (optional)

Use this to do something (usually cleanup) before detaching, which happens **before** `componentWillUnmount` lifecycle method.

#### Simple Graphics example

For example, this is how you could implement `Rectangle` component:
```javascript
// components/Rectangle.js
import { CustomPIXIComponent } from "react-pixi-fiber";
import * as PIXI from "pixi.js";

const TYPE = "Rectangle";
export const behavior = {
  customDisplayObject: props => new PIXI.Graphics(),
  customApplyProps: function(instance, oldProps, newProps) {
    const { fill, x, y, width, height } = newProps;
    instance.clear();
    instance.beginFill(fill);
    instance.drawRect(x, y, width, height);
    instance.endFill();
  }
};
export default CustomPIXIComponent(behavior, TYPE);
```

```jsx harmony
// App.js
import { render } from "react-pixi-fiber";
import * as PIXI from "pixi.js";
import Rectangle from "./components/Rectangle"

// Setup PixiJS Application
const canvasElement = document.getElementById("container")
const app = new PIXI.Application(800, 600, {
  view: canvasElement
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

PixiJS v4, v5 and v6 are supported.

### Can I use it in my TypeScript project?

Sure thing! We've got you covered.

### Can I use already existing [`PIXI.Application`]?

Yes, you can pass `app` property to `Stage` component, e.g. `<Stage app={app} />`.

### Can I migrate from `react-pixi`?

Yes, it is easy, read [migration guide](#migrating-from-react-pixi).

### Is server-side rendering supported?

No, unfortunately it is not supported right now.

## Contributing

The main purpose of this repository is to be able to render PixiJS objects inside React 16 Fiber architecture.
 
Development of React Pixi Fiber happens in the open on GitHub, and I would be grateful to the community for any contributions, including bug reports and suggestions.

Read below to learn how you can take part in improving React Pixi Fiber.

### [Code of Conduct](https://github.com/michalochman/react-pixi-fiber/blob/master/CODE_OF_CONDUCT.md)
React Pixi Fiber has adopted a Contributor Covenant Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://github.com/michalochman/react-pixi-fiber/blob/master/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

### [Contributing Guide](https://github.com/michalochman/react-pixi-fiber/blob/master/CONTRIBUTING.md)

Read the contributing guide to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to React Pixi Fiber.

### Contact

You can help others and discuss in our [gitter channel](https://gitter.im/react-pixi-fiber/Lobby).


## License

ReactPixiFiber is [MIT licensed]((https://github.com/michalochman/react-pixi-fiber/blob/master/LICENSE)).


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
[Root Container]: http://pixijs.download/release/docs/PIXI.Application.html#stage
[`PIXI.Application`]: http://pixijs.download/release/docs/PIXI.Application.html
[`PIXI.BitmapText`]: http://pixijs.download/release/docs/PIXI.BitmapText.html
[`PIXI.Container`]: http://pixijs.download/release/docs/PIXI.Container.html
[`PIXI.DisplayObject`]: http://pixijs.download/release/docs/PIXI.DisplayObject.html 
[`PIXI.extras.BitmapText`]: https://pixijs.download/v4.8.8/docs/PIXI.extras.BitmapText.html
[`PIXI.extras.TilingSprite`]: https://pixijs.download/v4.8.8/docs/PIXI.extras.TilingSprite.html
[`PIXI.Graphics`]: http://pixijs.download/release/docs/PIXI.Graphics.html
[`PIXI.NineSlicePlane`]: http://pixijs.download/release/docs/PIXI.NineSlicePlane.html
[`PIXI.ObservablePoint`]: http://pixijs.download/release/docs/PIXI.ObservablePoint.html
[`PIXI.ParticleContainer`]: http://pixijs.download/release/docs/PIXI.ParticleContainer.html
[`PIXI.particles.ParticleContainer`]: https://pixijs.download/v4.8.8/docs/PIXI.particles.ParticleContainer.html
[`PIXI.Point`]: http://pixijs.download/release/docs/PIXI.Point.html
[`PIXI.Sprite`]: http://pixijs.download/release/docs/PIXI.Sprite.html
[`PIXI.Text`]: http://pixijs.download/release/docs/PIXI.Text.html
[`PIXI.TilingSprite`]: http://pixijs.download/release/docs/PIXI.TilingSprite.html
[`react-pixi`]: https://github.com/Izzimach/react-pixi
