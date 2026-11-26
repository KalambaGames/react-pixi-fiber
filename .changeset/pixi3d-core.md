---
"react-pixi-fiber": minor
---

`configure` takes an optional `pixi3d` adapter, a `Pixi3dAdapter`, next to the `pixi` adapter. The core applies the props of a 3D node with it, and holds one table of props for each instance. So a 3D node and a Display Object can use one prop name with different types. A `null`, an `{}` or a value of the wrong length on a vector prop of a 3D node warns in development. The core then resets the prop to its default. Before `appendChild` and `insertBefore` change the tree, the core checks it. It throws for a 3D node in a Display Object or in the root container. It also throws for a Display Object or a filter in a 3D node. `configure` throws when the two adapters have the same tag. The core exports the types `Pixi3dAdapter`, `PixiNode3D`, `IsNode3D` and `Node3DProps`. It also exports the types `PointLike3DOf`, `PointProperties3D` and `SetterTypes3DOf`. The `PixiTypes` keys `Node3D`, `PointLikes3D` and `SetterTypes3D` are empty without a PixiJS 3D adapter.
