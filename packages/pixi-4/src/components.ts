import * as PIXI from "pixi.js";
import type { Behavior } from "react-pixi-fiber";

// The constructor reads the font from its style, so a `font` passed as a prop of its own goes in it too.
const BITMAP_TEXT_STYLE_KEYS = ["align", "font", "tint"];

function bitmapTextStyle(props: Record<string, any>) {
  const style = { ...props.style };
  for (const key of BITMAP_TEXT_STYLE_KEYS) if (props[key] !== undefined) style[key] = props[key];
  return style;
}

// PixiJS 4 has one mesh class, so `Mesh` and `MeshSimple` create the same Display Object.
const mesh: Behavior = {
  create: props => new PIXI.mesh.Mesh(props.texture, props.vertices, props.uvs, props.indices, props.drawMode),
};

export const components: Record<string, Behavior> = {
  AlphaFilter: { kind: "filter", create: props => new PIXI.filters.AlphaFilter(props.alpha) },
  AnimatedSprite: { create: props => new PIXI.extras.AnimatedSprite(props.textures, props.autoUpdate) },
  BitmapText: { create: props => new PIXI.extras.BitmapText(props.text, bitmapTextStyle(props)) },
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
  Graphics: { create: props => new PIXI.Graphics(props.nativeLines) },
  Mesh: mesh,
  MeshPlane: { create: props => new PIXI.mesh.Plane(props.texture, props.verticesX, props.verticesY) },
  MeshRope: { create: props => new PIXI.mesh.Rope(props.texture, props.points) },
  MeshSimple: mesh,
  NineSliceSprite: {
    create: props =>
      new PIXI.mesh.NineSlicePlane(
        props.texture,
        props.leftWidth,
        props.topHeight,
        props.rightWidth,
        props.bottomHeight
      ),
  },
  NoiseFilter: { kind: "filter", create: props => new PIXI.filters.NoiseFilter(props.noise, props.seed) },
  ParticleContainer: {
    create: props =>
      new PIXI.particles.ParticleContainer(props.maxSize, props.properties, props.batchSize, props.autoResize),
  },
  Sprite: { create: props => new PIXI.Sprite(props.texture) },
  Text: { create: props => new PIXI.Text(props.text, props.style, props.canvas) },
  TilingSprite: { create: props => new PIXI.extras.TilingSprite(props.texture, props.width, props.height) },
};

// The PixiJS 4 class names, the same behavior objects as the core tags they map to.
components.NineSlicePlane = components.NineSliceSprite;
components.Plane = components.MeshPlane;
components.Rope = components.MeshRope;
