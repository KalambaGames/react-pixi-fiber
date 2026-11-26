// Types only: a value import of @pixi/3d here would register the 3D backend in every runner.
import type { Scene3DSource } from "@pixi/3d";
import { Assets } from "pixi.js";
import { useEffect, useState } from "react";

// null until the file is ready.
// The Assets cache keeps the source. An app that drops the model calls Assets.unload(url).
export function useModel(url: string): Scene3DSource | null {
  const [source, setSource] = useState<Scene3DSource | null>(null);

  useEffect(() => {
    let current = true;
    Assets.load<Scene3DSource>(url)
      .then(loaded => {
        if (current) setSource(loaded);
      })
      .catch(console.error);
    return () => {
      current = false;
    };
  }, [url]);

  return source;
}
