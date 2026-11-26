---
"@react-pixi-fiber/pixi3d-0": major
---

Initial release. The PixiJS 3D adapter for `@pixi/3d` 0.1 or a later 0.1.x, with `pixi.js` 8.23 or newer. Pass it as `pixi3d` to `configure`, next to the PixiJS 8 adapter.

- It implements the tags `AmbientLight`, `BatchedMesh3D`, `Camera3D`, `Container3D`, `DirectionalLight`, `Mesh3D`, `Model3D`, `ParticleContainer3D`, `PointLight`, `SpotLight`, `Sprite3D` and `View3D`.
- A `<View3D>` takes 3D nodes as children. These rules choose its camera, in this order:
  1. A visible `<Camera3D active>` at any depth. With more than one, the last in tree order wins, and development builds warn.
  2. The last visible `<Camera3D>` that is a direct child of the view.
  3. The own camera of the view.
- The view chooses its camera again when the current camera leaves or is hidden. A node that moves and is or holds an active or direct camera also makes the view choose again.
- `<OrbitCamera>` and `<FPSCamera>` add the controllers that the app lists in `pixi3d0({ extras })`. The adapter builds a controller at commit.
- The vector props take an object, an array, a number or a string.
- The props that the constructor reads, such as `source` of `<Model3D>` and `size` of `<BatchedMesh3D>`, are constructor-only.
- The package is an ES module only. A view does not draw with the canvas renderer.
