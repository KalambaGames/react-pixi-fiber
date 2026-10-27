import { BaseTexture, type ISpritesheetData, Spritesheet, type Texture } from "pixi.js";
import { useEffect, useState } from "react";

// One sheet per image, shared by every component that uses it.
// The cache keeps each sheet while the page is open. An app that unloads a sheet must destroy it.
const loading = new Map<string, Promise<Spritesheet>>();
const ready = new Map<string, Spritesheet>();

function load(image: string, data: ISpritesheetData) {
  let promise = loading.get(image);
  if (!promise) {
    const sheet = new Spritesheet(BaseTexture.from(image), data);
    promise = sheet.parse().then(() => {
      ready.set(image, sheet);
      return sheet;
    });
    // A failed load leaves the cache, so the next mount tries again.
    promise.catch(() => loading.delete(image));
    loading.set(image, promise);
  }
  return promise;
}

// textures is empty until the sheet is ready.
export function useSpritesheet<Data extends ISpritesheetData>(image: string, data: Data) {
  const [sheet, setSheet] = useState(() => ready.get(image));

  useEffect(() => {
    if (sheet) return;
    let cancelled = false;
    load(image, data)
      .then(loaded => {
        if (!cancelled) setSheet(loaded);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [image, data, sheet]);

  return { textures: (sheet?.textures ?? {}) as Partial<Record<keyof Data["frames"] & string, Texture>> };
}
