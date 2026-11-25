# @react-pixi-fiber/pixi3d-0

[![npm](https://img.shields.io/npm/v/@react-pixi-fiber/pixi3d-0.svg)](https://npmjs.com/package/@react-pixi-fiber/pixi3d-0)

PixiJS 3D adapter for [react-pixi-fiber](https://github.com/KalambaGames/react-pixi-fiber). It tells `react-pixi-fiber` how to create the classes of [`@pixi/3d`](https://www.npmjs.com/package/@pixi/3d) 0.1 for 12 tags and 2 camera controller tags. It also tells how to write the vector props of a 3D node.

Install it next to `react-pixi-fiber`, `@pixi/3d` 0.1.x, `pixi.js` 8.23 or newer, and the React adapter and the [PixiJS 8 adapter](../pixi-8/README.md). Then configure once in the app entry, before the first render:

```js
import { configure } from "react-pixi-fiber";
import reactN from "@react-pixi-fiber/react-N"; // the React adapter for your React version
import pixi8 from "@react-pixi-fiber/pixi-8";
import pixi3d0 from "@react-pixi-fiber/pixi3d-0";

configure({ react: reactN(), pixi: pixi8(), pixi3d: pixi3d0() });
```

Render a `View3D` anywhere a Display Object can go. Its children are 3D nodes:

```jsx
import { Stage } from "react-pixi-fiber";
import { AmbientLight, Camera3D, Mesh3D, View3D } from "@react-pixi-fiber/pixi3d-0";

<Stage options={{ width: 800, height: 600 }}>
  <View3D width={800} height={600}>
    <Camera3D position={[0, 1, 5]} />
    <AmbientLight intensity={0.5} />
    <Mesh3D geometry={geometry} material={material} angle={[0, 45, 0]} />
  </View3D>
</Stage>;
```

## Supported features

Features that are plain `@pixi/3d` work as the `@pixi/3d` documentation describes.

| Tag | Creates |
| --- | --- |
| `AmbientLight` | `AmbientLight` |
| `BatchedMesh3D` | `BatchedMesh3D`, `size` is required |
| `Camera3D` | `Camera3D` |
| `Container3D` | `Container3D` |
| `DirectionalLight` | `DirectionalLight` |
| `FPSCamera` | A node that holds an `FPSCamera` controller, see [Controllers](#controllers) |
| `Mesh3D` | `Mesh3D` |
| `Model3D` | `Model3D`, `source` is required |
| `OrbitCamera` | A node that holds an `OrbitCamera` controller, see [Controllers](#controllers) |
| `ParticleContainer3D` | `ParticleContainer3D` |
| `PointLight` | `PointLight` |
| `SpotLight` | `SpotLight` |
| `Sprite3D` | `Sprite3D` |
| `View3D` | `View3D` |

| Feature | Support |
| --- | --- |
| `defaults` option | Default props per tag, like React's `defaultProps`: with `pixi3d0({ defaults: { Camera3D: { fov: 45 } } })`, `<Camera3D />` mounts with `fov` 45. Key each tag as you write it. A prop that you remove later returns to its default, see [Default props per tag](../react-pixi-fiber/README.md#default-props-per-tag). A default does not make a required prop optional in JSX |
| `extras` option | The camera controller classes that the app renders, see [Controllers](#controllers) |
| Events | The PixiJS 8 handler props, for example `onpointerdown`, on every 3D node |
| TypeScript | Importing the package types the props of every tag from the `@pixi/3d` classes. A prop takes what the setter takes |

### Constructor-only props

The constructor of a class reads some props only at creation. A change after mount warns in development. Give the element a new `key` to change one. The props are:

| Tag | Props |
| --- | --- |
| `BatchedMesh3D` | `instanceData`, `size` |
| `Mesh3D` | `skeleton` |
| `Model3D` | `autoPlay`, `autoUpdate`, `castShadow`, `receiveShadow`, `scene`, `source` |
| `ParticleContainer3D` | `alphaCutoff`, `alphaMode`, `billboard`, `capacity`, `extraBits`, `space`, `texture` |
| `View3D` | `composite`, `graph` |

`View3D` takes no `camera` prop and no `root` prop. The children of the element are the scene. A `camera` or `root` prop warns one time in development, and the adapter ignores it.

## Vector props

A 3D node has vector props, for example `position`, `scale`, `angle` and `origin`. Each takes one of these forms:

| Form | Example | Result |
| --- | --- | --- |
| Object | `position={{ x: 1, y: 2, z: 3 }}` | The three coordinates |
| Array | `position={[1, 2, 3]}` | The three coordinates |
| Number | `scale={2}` or `angle={45}` | Every coordinate gets this number. `angle={45}` turns 45 degrees about each axis |
| String | `position="1, 2, 3"` or `scale="2"` | Three parts, or one part for every coordinate |

A quaternion prop takes an object `{ x, y, z, w }` or an array of four numbers. `anchor` of `Sprite3D` is a 2D point and takes the 2D forms.

A `null`, an `{}` or a value of the wrong length on a 3D vector prop warns in development and resets the prop to its default. A 2D point prop of a Display Object does not do this.

## Tree rules

A 3D node is not a Display Object. A Display Object cannot hold a 3D node, and a 3D node cannot hold a Display Object. `View3D` is the one Display Object that holds 3D nodes. `react-pixi-fiber` throws before the tree changes:

| Case | Error |
| --- | --- |
| A 3D node in a Display Object, or in the root container | `<Mesh3D />` is a 3D node. It cannot be a child of `<Container />`. Put it in a 3D view or in another 3D node. |
| A Display Object in a 3D node | `<Sprite />` is not a 3D node. It cannot be a child of the 3D node `<Container3D />`. |
| A filter in a 3D node | `<BlurFilter />` is a filter. It cannot be a child of the 3D node `<Mesh3D />`. Put it in the element of the 3D view. |
| A Display Object in a `View3D` | `View3D` takes only 3D nodes as children. Put a Display Object next to the view, for example a label after `<View3D>`. |

The same rules apply to the fallback of a `<Suspense>` in a 3D tree. Use `fallback={null}` or a 3D node, for example `fallback={<Mesh3D />}`.

## Cameras

A `View3D` always has a camera. These rules choose it:

1. A `<Camera3D>` that is a direct child of `<View3D>` is a camera of the view. The view draws from the last visible one.
2. When no direct child is a visible camera, the view draws from its own camera. The adapter puts it first in the root of the view.
3. A camera that you assign with `view.camera` through a ref stays until that camera leaves the view or is hidden. A `<Camera3D>` that is added, removed or hidden under the view makes the view choose again.

`@pixi/3d` throws on each frame for a camera that left its view or is hidden. So the adapter moves the view to another camera in the same commit that removes or hides the camera.

## Controllers

`<OrbitCamera>` and `<FPSCamera>` add a camera controller to a view. A controller is not a camera. It moves the camera that the view draws from. So set the start with `<Camera3D position>`. Despite their names, `OrbitCamera` and `FPSCamera` are the controller classes of `@pixi/3d`, in `@pixi/3d/extras`. The tags keep the class names. Each is a direct child of `<View3D>`. In another place, the tag throws `<OrbitCamera /> must be a direct child of <View3D />.` Give the adapter the classes that the app renders:

```jsx
import { FPSCamera, OrbitCamera } from "@pixi/3d/extras";

configure({ react: reactN(), pixi: pixi8(), pixi3d: pixi3d0({ extras: { OrbitCamera } }) });

<View3D width={800} height={600}>
  <Camera3D position={[0, 2, 6]} />
  <OrbitCamera maxDistance={8} target={[0, 1, 0]} mouseButtons={{ left: "pan" }} />
</View3D>;
```

A tag that is not in `extras` throws at first render. The error names the class to add. The bundle of the app holds only the controllers that it lists.

- The props are the options of the controller, without `view`.
- `target` and `up` take the vector forms. `mouseButtons` and `touches` of `<OrbitCamera>` take a part of the object. The other buttons keep their defaults.
- `<FPSCamera>` has no `position` prop. Place the camera with a `<Camera3D position>`.
- `enabled` turns the controller on and off. A hidden element turns it off.
- The adapter destroys the controller one time, when its element unmounts or when the view unmounts.

## Models

`Model3D` takes a loaded source. Load it outside the render. A hook gives `null` until the source is ready:

```tsx
import { useEffect, useState } from "react";
import { Model3D } from "@react-pixi-fiber/pixi3d-0";
import { Assets } from "pixi.js";
import type { Scene3DSource } from "@pixi/3d";

function useModel(url: string): Scene3DSource | null {
  const [source, setSource] = useState<Scene3DSource | null>(null);
  useEffect(() => {
    let current = true;
    Assets.load<Scene3DSource>(url).then(loaded => {
      if (current) setSource(loaded);
    });
    return () => {
      current = false;
    };
  }, [url]);
  return source;
}

function Robot() {
  const source = useModel("robot.glb");
  return source && <Model3D key="robot" source={source} />;
}
```

## What the app destroys

An unmounted 3D node is destroyed with `destroy({ children: true })`. This does not destroy the geometries, the materials, the textures and the model sources that the nodes used, because other nodes can share them. The app destroys what it created, when no node uses it. Unload a model source with `Assets.unload`.

## Renderer

`@pixi/3d` adds its WebGL and WebGPU extensions when the app imports it. An app that makes its own renderer and sets `skipExtensionImports` must import `@pixi/3d/webgl` or `@pixi/3d/webgpu`.

## Limits

- This package is an ES module only. It has no CommonJS build. Node loads the development build. To load the production build, run Node with `--conditions=production`.
- A prop name that only a 3D node has gets no casing warning. For example, `castshadow` is not reported.
- A 3D component that you register with `PIXIComponent` is not guarded by the camera fallback. A `Camera3D` subclass that you register this way, and remove directly from a view, is also not guarded.
- A size prop, `width`, `height` or `depth`, is measured when it is written. A later change of only the texture, `pixelSize` or geometry keeps the scale, not the size.
- A view does not draw with the canvas renderer.
- If the app hides the own camera of a view, the view can still fall back to it.
