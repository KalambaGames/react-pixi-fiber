import * as PIXI from "pixi.js";
import type { Behavior } from "react-pixi-fiber";

// The constructor reads the font from its style, so a `fontName` passed as a prop of its own goes in it too.
const BITMAP_TEXT_STYLE_KEYS = ["align", "fontName", "fontSize", "letterSpacing", "maxWidth", "tint"];

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

// Whether one of `keys` changed after mount. The core writes these constructor arguments to the instance as well,
// where PixiJS does not read them, so `applyProps` passes them to the geometry.
function changed(oldProps: Record<string, unknown> | undefined, newProps: Record<string, unknown>, keys: string[]) {
  return oldProps !== undefined && keys.some(key => oldProps[key] !== newProps[key]);
}

export const behaviors: Record<string, Behavior> = {
  AlphaFilter: { kind: "filter", create: props => new PIXI.filters.AlphaFilter(props.alpha) },
  // `playing` calls `play()` or `stop()` and does not write a property. The `textures` setter stops the sprite, so
  // `applyProps` sets the playback after the other props. Without `playing`, a sprite that played before a `textures`
  // change plays again after it. A removed `playing` stops the sprite, as before the first `play()`. A finished sprite
  // with `loop` false plays again from frame 0, like a media element that ended.
  AnimatedSprite: {
    create: props => new PIXI.AnimatedSprite(props.textures, props.autoUpdate),
    applyProps(animated: PIXI.AnimatedSprite, oldProps, newProps) {
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
    create: props => new PIXI.BitmapText(props.text, bitmapTextStyle(props)),
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
  Graphics: { constructorOnly: ["geometry"], create: props => new PIXI.Graphics(props.geometry) },
  Mesh: { create: props => new PIXI.Mesh(props.geometry, props.shader, props.state, props.drawMode) },
  // A removed size gets the PlaneGeometry default.
  MeshPlane: {
    create: props => new PIXI.SimplePlane(props.texture, props.verticesX, props.verticesY),
    applyProps(mesh: PIXI.SimplePlane, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      if (!changed(oldProps, newProps, ["verticesX", "verticesY"])) return;
      const geometry = mesh.geometry as unknown as { build(): void; segHeight: number; segWidth: number };
      geometry.segWidth = newProps.verticesX ?? 10;
      geometry.segHeight = newProps.verticesY ?? 10;
      geometry.build();
    },
  },
  // Without `points` the rope keeps the points it has, because PixiJS cannot build a rope with none.
  MeshRope: {
    create: props => new PIXI.SimpleRope(props.texture, props.points, props.textureScale),
    applyProps(rope: PIXI.SimpleRope, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      if (!changed(oldProps, newProps, ["points", "textureScale"])) return;
      // The PixiJS types mark `build` private and `textureScale` read-only. `update` calls `build`, which reads both.
      const geometry = rope.geometry as unknown as { build(): void; points: unknown; textureScale: number };
      geometry.points = newProps.points ?? geometry.points;
      geometry.textureScale = newProps.textureScale ?? 0;
      if (geometry.textureScale > 0) rope.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
      geometry.build();
    },
  },
  // A removed prop gets the value that the constructor sets when it does not get the prop: PixiJS fills a buffer that
  // gets no data with one float.
  MeshSimple: {
    create: props => new PIXI.SimpleMesh(props.texture, props.vertices, props.uvs, props.indices, props.drawMode),
    applyProps(mesh: PIXI.SimpleMesh, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      const { indices, uvs } = newProps;
      if (changed(oldProps, newProps, ["uvs"]))
        mesh.geometry.getBuffer("aTextureCoord").update(uvs ?? new Float32Array(1));
      // `update` makes an array a Float32Array, which an index buffer cannot be.
      if (changed(oldProps, newProps, ["indices"]))
        mesh.geometry
          .getIndex()
          .update(Array.isArray(indices) ? new Uint16Array(indices) : (indices ?? new Float32Array(1)));
    },
  },
  NineSliceSprite: {
    create: props =>
      new PIXI.NineSlicePlane(props.texture, props.leftWidth, props.topHeight, props.rightWidth, props.bottomHeight),
  },
  NoiseFilter: { kind: "filter", create: props => new PIXI.filters.NoiseFilter(props.noise, props.seed) },
  // The renderer builds its buffers from `maxSize`, `batchSize` and `properties` on the first render. `dispose` drops
  // them, so a changed `properties` takes effect. PixiJS keeps `maxSize` and `batchSize` in private fields.
  ParticleContainer: {
    constructorOnly: ["batchSize", "maxSize"],
    create: props => new PIXI.ParticleContainer(props.maxSize, props.properties, props.batchSize, props.autoResize),
    applyProps(container: PIXI.ParticleContainer, oldProps, newProps) {
      this.applyDisplayObjectProps(oldProps, newProps);
      if (!changed(oldProps, newProps, ["properties"])) return;
      // The constructor defaults, which `setProperties` keeps for a key that the new properties do not have.
      container.setProperties({
        position: true,
        rotation: false,
        scale: false,
        tint: false,
        uvs: false,
        ...newProps.properties,
      });
      container.dispose();
    },
  },
  Sprite: { create: props => new PIXI.Sprite(props.texture) },
  Text: { constructorOnly: ["canvas"], create: props => new PIXI.Text(props.text, props.style, props.canvas) },
  TilingSprite: { create: props => new PIXI.TilingSprite(props.texture, props.width, props.height) },
};

// The PixiJS 6 class names, the same behavior objects as the core tags they map to.
behaviors.NineSlicePlane = behaviors.NineSliceSprite;
behaviors.SimpleMesh = behaviors.MeshSimple;
behaviors.SimplePlane = behaviors.MeshPlane;
behaviors.SimpleRope = behaviors.MeshRope;
