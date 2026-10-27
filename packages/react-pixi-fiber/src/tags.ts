// The core tags, PixiJS 8 spelling. Every PixiJS adapter implements all of them.
// The Display Object tags.
export const DISPLAY_OBJECT_TAGS = {
  AnimatedSprite: "AnimatedSprite",
  BitmapText: "BitmapText",
  Container: "Container",
  Graphics: "Graphics",
  Mesh: "Mesh",
  MeshPlane: "MeshPlane",
  MeshRope: "MeshRope",
  MeshSimple: "MeshSimple",
  NineSliceSprite: "NineSliceSprite",
  ParticleContainer: "ParticleContainer",
  Sprite: "Sprite",
  Text: "Text",
  TilingSprite: "TilingSprite",
} as const;
// The filter tags, child elements of a Display Object.
export const FILTER_TAGS = {
  AlphaFilter: "AlphaFilter",
  BlurFilter: "BlurFilter",
  ColorMatrixFilter: "ColorMatrixFilter",
  DisplacementFilter: "DisplacementFilter",
  NoiseFilter: "NoiseFilter",
} as const;
export const TAGS = { ...DISPLAY_OBJECT_TAGS, ...FILTER_TAGS } as const;
export type Tag = keyof typeof TAGS;
// 2.x tag names, resolved after the registry and the adapter. Removed in 4.0.0.
export const DEPRECATED_TAGS: Record<string, Tag> = { NineSlicePlane: "NineSliceSprite" };
