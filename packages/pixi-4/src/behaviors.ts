import * as PIXI from "pixi.js";
import type { Behavior } from "react-pixi-fiber";

// The constructor reads the font from its style, so a `font` passed as a prop of its own goes in it too.
const BITMAP_TEXT_STYLE_KEYS = ["align", "font", "tint"];

function bitmapTextStyle(props: Record<string, any>) {
  const style = { ...props.style };
  for (const key of BITMAP_TEXT_STYLE_KEYS) if (props[key] !== undefined) style[key] = props[key];
  return style;
}

// BitmapText has a setter for each style key and none for the style, so each key goes through the props.
function bitmapTextProps(props: Record<string, any> | undefined) {
  if (props === undefined) return undefined;
  const { style, ...rest } = props;
  const merged = bitmapTextStyle(props);
  for (const key of BITMAP_TEXT_STYLE_KEYS) if (merged[key] !== undefined) rest[key] = merged[key];
  return rest;
}

// Whether one of `keys` changed after mount.
function changed(oldProps: Record<string, unknown> | undefined, newProps: Record<string, unknown>, keys: string[]) {
  return oldProps !== undefined && keys.some(key => oldProps[key] !== newProps[key]);
}

// PixiJS 4 has one mesh class, so `Mesh` and `MeshSimple` create the same Display Object. The renderer uploads `uvs`
// and `indices` only when `dirty` and `indexDirty` change. A removed prop gets the value that the constructor sets when
// it does not get the prop.
const mesh: Behavior = {
  create: props => new PIXI.mesh.Mesh(props.texture, props.vertices, props.uvs, props.indices, props.drawMode),
  applyProps(instance: PIXI.mesh.Mesh, oldProps, newProps) {
    this.applyDisplayObjectProps(oldProps, newProps);
    if (changed(oldProps, newProps, ["uvs"])) {
      if (newProps.uvs === undefined) instance.uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
      instance.dirty++;
    }
    if (changed(oldProps, newProps, ["indices"])) {
      if (newProps.indices === undefined) instance.indices = new Uint16Array([0, 1, 3, 2]);
      instance.indexDirty++;
    }
  },
};

export const behaviors: Record<string, Behavior> = {
  AlphaFilter: { kind: "filter", create: props => new PIXI.filters.AlphaFilter(props.alpha) },
  // `playing` calls `play()` or `stop()` and does not write a property. The `textures` setter stops the sprite, so
  // `applyProps` sets the playback after the other props. Without `playing`, a sprite that played before a `textures`
  // change plays again after it. A removed `playing` stops the sprite, as before the first `play()`. A finished sprite
  // with `loop` false plays again from frame 0, like a media element that ended.
  // PixiJS 4 keeps `autoUpdate` in a private field that only the constructor sets.
  AnimatedSprite: {
    constructorOnly: ["autoUpdate"],
    create: props => new PIXI.extras.AnimatedSprite(props.textures, props.autoUpdate),
    applyProps(animated: PIXI.extras.AnimatedSprite, oldProps, newProps) {
      const { playing: oldPlaying, ...oldRest } = oldProps ?? {};
      const { playing, ...props } = newProps;
      const wasPlaying = animated.playing;
      this.applyDisplayObjectProps(oldProps && oldRest, props);
      const texturesChanged = oldProps !== undefined && oldRest.textures !== props.textures;
      if (playing !== oldPlaying || texturesChanged) {
        if (!(playing ?? (oldPlaying === undefined && wasPlaying))) animated.stop();
        else if (!animated.playing && !animated.loop && animated.currentFrame === animated.totalFrames - 1)
          animated.gotoAndPlay(0);
        else animated.play();
      }
    },
  },
  BitmapText: {
    create: props => new PIXI.extras.BitmapText(props.text, bitmapTextStyle(props)),
    applyProps(_text, oldProps, newProps) {
      this.applyDisplayObjectProps(bitmapTextProps(oldProps), bitmapTextProps(newProps)!);
    },
  },
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
  // Plane and Rope build their buffers in `refresh(true)`. Without it, they rebuild only when the texture changes. A
  // removed size gets the value that the constructor sets when it does not get the size.
  MeshPlane: {
    create: props => new PIXI.mesh.Plane(props.texture, props.verticesX, props.verticesY),
    applyProps(plane: PIXI.mesh.Plane, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      if (!changed(oldProps, newProps, ["verticesX", "verticesY"])) return;
      plane.verticesX = newProps.verticesX ?? 10;
      plane.verticesY = newProps.verticesY ?? 10;
      // The Plane types drop the `forceUpdate` argument of `Mesh.refresh`.
      (plane as PIXI.mesh.Mesh).refresh(true);
    },
  },
  // Without `points` the rope keeps the points it has, because PixiJS cannot build a rope with none.
  MeshRope: {
    create: props => new PIXI.mesh.Rope(props.texture, props.points),
    applyProps(rope: PIXI.mesh.Rope, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      if (!changed(oldProps, newProps, ["points"])) return;
      if (newProps.points === undefined) rope.points = oldProps!.points;
      rope.refresh(true);
    },
  },
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
  // The renderer builds its buffers from these on the first render and keeps them in a private field.
  ParticleContainer: {
    constructorOnly: ["batchSize", "maxSize", "properties"],
    create: props =>
      new PIXI.particles.ParticleContainer(props.maxSize, props.properties, props.batchSize, props.autoResize),
  },
  Sprite: { create: props => new PIXI.Sprite(props.texture) },
  Text: { constructorOnly: ["canvas"], create: props => new PIXI.Text(props.text, props.style, props.canvas) },
  TilingSprite: { create: props => new PIXI.extras.TilingSprite(props.texture, props.width, props.height) },
};

// The PixiJS 4 class names, the same behavior objects as the core tags they map to.
behaviors.NineSlicePlane = behaviors.NineSliceSprite;
behaviors.Plane = behaviors.MeshPlane;
behaviors.Rope = behaviors.MeshRope;
