---
"@react-pixi-fiber/pixi-4": major
---

Initial release. The PixiJS 4 adapter for PixiJS 4.6, the first with `AlphaFilter`, or a later 4.x. It implements the 13 core tags, `Mesh` and `MeshSimple` both create `PIXI.mesh.Mesh`, and keeps `NineSlicePlane`, `Plane` and `Rope` as tags for `NineSliceSprite`, `MeshPlane` and `MeshRope`. `Graphics` passes `nativeLines` to the constructor. PixiJS 4 ships no typings; for TypeScript install `@types/pixi.js` 4, an optional peer. It exports the `InteractionCompatibility`, `InteractionEventCompatibility`, `InteractiveComponent` and `PixiTypeFallback` types.
