---
"@react-pixi-fiber/pixi3d-0": major
---

Initial release. The PixiJS 3D adapter for `@pixi/3d` 0.1 or a later 0.1.x, with `pixi.js` 8.23 or newer. Pass it as `pixi3d` to `configure`, next to the PixiJS 8 adapter. It implements the tags `AmbientLight`, `BatchedMesh3D`, `Camera3D`, `Container3D`, `DirectionalLight`, `Mesh3D`, `Model3D`, `ParticleContainer3D`, `PointLight`, `SpotLight`, `Sprite3D` and `View3D`. A `<View3D>` takes 3D nodes as children. A direct `<Camera3D>` child sets its camera, and the view falls back to a camera when the current one leaves or is hidden. `<OrbitCamera>` and `<FPSCamera>` add the controllers that the app lists in `pixi3d0({ extras })`. The vector props take an object, an array, a number or a string. The props that the constructor reads, such as `source` of `<Model3D>` and `size` of `<BatchedMesh3D>`, are constructor-only. The package is an ES module only, and a view does not draw with the canvas renderer.
