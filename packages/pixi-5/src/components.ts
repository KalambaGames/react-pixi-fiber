import * as PIXI from "pixi.js";
import type { Behavior } from "react-pixi-fiber";

// The constructor reads the font from its style, so a `fontName` passed as a prop of its own goes in it too.
const BITMAP_TEXT_STYLE_KEYS = ["align", "font", "fontName", "fontSize", "letterSpacing", "maxWidth", "tint"];

function bitmapTextStyle(props: Record<string, any>) {
  const style = { ...props.style };
  for (const key of BITMAP_TEXT_STYLE_KEYS) if (props[key] !== undefined) style[key] = props[key];
  return style;
}

export const components: Record<string, Behavior> = {
  AlphaFilter: { kind: "filter", create: props => new PIXI.filters.AlphaFilter(props.alpha) },
  AnimatedSprite: {
    create: props => new PIXI.AnimatedSprite(props.textures, props.autoUpdate),
  },
  BitmapText: { create: props => new PIXI.BitmapText(props.text, bitmapTextStyle(props)) },
  BlurFilter: {
    kind: "filter",
    create: props => new PIXI.filters.BlurFilter(props.blur, props.quality, props.resolution, props.kernelSize),
  },
  ColorMatrixFilter: { kind: "filter", create: () => new PIXI.filters.ColorMatrixFilter() },
  Container: { create: () => new PIXI.Container() },
  DisplacementFilter: {
    kind: "filter",
    create: props => new PIXI.filters.DisplacementFilter(props.sprite, props.scale),
  },
  FXAAFilter: { kind: "filter", create: () => new PIXI.filters.FXAAFilter() },
  Graphics: { create: props => new PIXI.Graphics(props.geometry) },
  Mesh: { create: props => new PIXI.Mesh(props.geometry, props.shader, props.state, props.drawMode) },
  MeshPlane: { create: props => new PIXI.SimplePlane(props.texture, props.verticesX, props.verticesY) },
  MeshRope: { create: props => new PIXI.SimpleRope(props.texture, props.points, props.textureScale) },
  MeshSimple: {
    create: props => new PIXI.SimpleMesh(props.texture, props.vertices, props.uvs, props.indices, props.drawMode),
  },
  NineSliceSprite: {
    create: props =>
      new PIXI.NineSlicePlane(props.texture, props.leftWidth, props.topHeight, props.rightWidth, props.bottomHeight),
  },
  NoiseFilter: { kind: "filter", create: props => new PIXI.filters.NoiseFilter(props.noise, props.seed) },
  ParticleContainer: {
    create: props => new PIXI.ParticleContainer(props.maxSize, props.properties, props.batchSize, props.autoResize),
  },
  Sprite: { create: props => new PIXI.Sprite(props.texture) },
  Text: { create: props => new PIXI.Text(props.text, props.style, props.canvas) },
  TilingSprite: { create: props => new PIXI.TilingSprite(props.texture, props.width, props.height) },
};

// The PixiJS 5 class names, the same behavior objects as the core tags they map to.
components.NineSlicePlane = components.NineSliceSprite;
components.SimpleMesh = components.MeshSimple;
components.SimplePlane = components.MeshPlane;
components.SimpleRope = components.MeshRope;
