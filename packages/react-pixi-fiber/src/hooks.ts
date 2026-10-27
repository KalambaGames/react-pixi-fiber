import type { PixiApplication } from "./types";
import React from "react";
import { useContext, useEffect } from "react";
import { AppContext } from "./AppProvider";
import invariant from "./invariant";

export function usePixiApp(): PixiApplication {
  const app = useContext(AppContext);

  invariant(app !== null, "No PIXI.Application is available here. You can only access it in children of <Stage />");

  return app;
}

// The callback `app.ticker.add` takes on the configured PixiJS version, a delta-time callback without an adapter.
export type PixiTickerCallback = PixiApplication extends { ticker: { add(fn: infer F, ...rest: any[]): unknown } }
  ? F
  : (deltaTime: number) => void;

export interface PixiTickerOptions {
  // `false` removes the callback from the ticker. `true` adds it back. Default `true`.
  enabled?: boolean;
  // The `priority` argument of `ticker.add`, a PixiJS `UPDATE_PRIORITY` value.
  priority?: number;
}

export function usePixiTicker(fn: PixiTickerCallback, options?: PixiTickerOptions): void {
  const { ticker } = usePixiApp();
  const { enabled = true, priority } = options ?? {};

  invariant(ticker != null, "`usePixiTicker` needs an `app` with a `ticker`.");

  useEffect(() => {
    if (!enabled) {
      return;
    }

    ticker.add(fn, undefined, priority);

    return () => {
      ticker.remove(fn);
    };
  }, [enabled, fn, priority, ticker]);
}
