import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { Ref } from "react";
import { getPixiAdapter } from "../configure";
import invariant from "../invariant";
import type { StageComponent, StageProps, StageRef } from "../types";
import { shallowEqual } from "../utils";
import warning from "../warning";
import {
  cleanupStage,
  renderStage,
  rerenderStage,
  resizeRenderer,
  STAGE_OPTIONS_RECREATE,
  STAGE_OPTIONS_UNMOUNT,
} from "./common";
import { ContextBridge } from "./ContextBridge";
import { getCanvasProps } from "./props";

interface InitToken {
  cancelled: boolean;
}

const warned: Record<string, boolean> = {};
function warnOnce(key: string, message: string) {
  if (!warned[key]) {
    warned[key] = true;
    warning(false, message);
  }
}

// The ref keeps the 2.x shape. In development `_app.current` warns while init is pending.
export function createStageRef(
  appRef: { current: any },
  canvasRef: { current: HTMLCanvasElement | null },
  props: StageProps,
  isPending: () => boolean,
  warnedRead: { current: boolean }
): StageRef {
  const stageRef = { _app: appRef, _canvas: canvasRef, props } as StageRef;
  if (__DEV__) {
    stageRef._app = {
      get current() {
        if (appRef.current == null && isPending() && !warnedRead.current) {
          warnedRead.current = true;
          warning(
            false,
            "`_app.current` of `Stage` is null until the PixiJS application is created. Pass an `onInit(app)` prop to read the application when it is ready."
          );
        }
        return appRef.current;
      },
      set current(value) {
        appRef.current = value;
      },
    } as StageRef["_app"];
  }
  return stageRef;
}

// Renderer options other than the size are immutable, a change to any of them needs a new application.
function needsRecreate(prevOptions: unknown, nextOptions: unknown): boolean {
  const { height, width, ...other } = (nextOptions || {}) as Record<string, unknown>;
  const { height: prevHeight, width: prevWidth, ...prevOther } = (prevOptions || {}) as Record<string, unknown>;
  return !shallowEqual(other, prevOther);
}

function StageWithoutBridge(props: StageProps, ref: Ref<StageRef>) {
  const { app, options } = props;
  const pixi = getPixiAdapter();

  if (__DEV__) {
    if (props.width != null || props.height != null) {
      warnOnce(
        "size",
        "`width` and `height` props of `Stage` are deprecated. They size `app.stage`, not the renderer. To size the renderer, pass them in `options`. They will be removed in 4.0.0."
      );
    }
    if (app != null && options != null && Object.keys(options).length > 0) {
      warnOnce(
        "app",
        "`options` prop of `Stage` has no effect when `app` is provided. Use `app` or `options`, never both."
      );
    }
    if (app != null && props.destroyOptions !== undefined) {
      warnOnce(
        "appDestroy",
        "`destroyOptions` and `onBeforeDestroy` props of `Stage` have no effect when `app` is provided. `Stage` never destroys an application it did not create."
      );
    }
  }
  if (app != null) {
    invariant(
      pixi.isApplication(app),
      "Provided `app` has to be a PIXI.Application, or an object that the PixiJS adapter accepts as one"
    );
  }

  const appRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pendingRef = useRef<InitToken | null>(null);
  const latestProps = useRef(props);
  // Written on commit, before the effects below read it: a render React discards never reaches the application.
  useLayoutEffect(() => {
    latestProps.current = props;
  });
  // The props the current application has had applied. Null while init is pending.
  const appliedProps = useRef<StageProps | null>(null);
  const recreating = useRef(false);
  // An application created with outdated options, destroyed in the next cleanup.
  const doomedRef = useRef<any>(null);
  // Settles once the previous application is destroyed. The next one waits for it: it may share the canvas and its
  // WebGL context, and a destroy resets state of that context, like the bound shader program, that a renderer caches.
  const previousRef = useRef<Promise<unknown> | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);

  // Once per Stage: the ref object is rebuilt on every props change, the warned flag is not.
  const warnedRead = useRef(false);
  // A rejected createApplication, or an error thrown once it resolved, is rethrown during render, so an error boundary sees it.
  const [, setInitError] = useState<unknown>(null);

  useImperativeHandle(
    ref,
    () => createStageRef(appRef, canvasRef, props, () => pendingRef.current != null, warnedRead),
    [props]
  );

  // Create or adopt the application. Runs again when the canvas is replaced (canvasKey).
  // biome-ignore lint/correctness/useExhaustiveDependencies: reads the latest props through a ref on purpose
  useLayoutEffect(() => {
    const token: InitToken = { cancelled: false };
    pendingRef.current = token;
    const { app: providedApp, options: initialOptions = {} } = latestProps.current;
    const provided = providedApp != null;
    const previous = previousRef.current;
    previousRef.current = null;
    const create = () =>
      pixi.createApplication({ view: canvasRef.current, ...(initialOptions as Record<string, unknown>) });
    const created = provided
      ? providedApp
      : previous
        ? previous.then(() => (token.cancelled ? null : create()))
        : create();
    // Set once the stage is rendered: an application that failed before that is destroyed by the rejection below.
    let rendered = false;

    const settled = Promise.resolve(created)
      .then((resolved: any) => {
        if (token.cancelled) {
          if (!provided && resolved != null) {
            pixi.destroyApplication(resolved, false, latestProps.current.destroyOptions ?? STAGE_OPTIONS_UNMOUNT);
          }
          return;
        }
        pendingRef.current = null;
        const current = latestProps.current;
        // `options` changed while init was pending: the application was created with the old ones.
        if (!provided && needsRecreate(initialOptions, current.options)) {
          doomedRef.current = resolved;
          setCanvasKey(key => key + 1);
          return;
        }
        if (__DEV__ && !provided) {
          const { canvas, view } = initialOptions as { canvas?: unknown; view?: unknown };
          if (canvas != null && view == null && ("canvas" in resolved ? resolved.canvas : resolved.view) !== canvas) {
            warnOnce(
              "canvas",
              "`options.canvas` of `Stage` is a PixiJS 8 option and this application does not render to it. Pass the canvas as `options.view`."
            );
          }
        }
        appRef.current = resolved;
        renderStage(resolved, current);
        rendered = true;
        appliedProps.current = current;
        if (!provided) resizeRenderer(resolved, { options: initialOptions }, current);
        // Once per created application: after a recreate it fires again with the new one.
        if (typeof current.onInit === "function") current.onInit(resolved);
      })
      .catch(error => {
        if (token.cancelled) return;
        pendingRef.current = null;
        if (!rendered && appRef.current != null) {
          if (!provided) pixi.destroyApplication(appRef.current, false, STAGE_OPTIONS_UNMOUNT);
          appRef.current = null;
        }
        setInitError(() => {
          throw error;
        });
      });

    return () => {
      // On a canvasKey change React has already removed the old canvas; on unmount it has not.
      if (doomedRef.current != null) {
        pixi.destroyApplication(doomedRef.current, false, STAGE_OPTIONS_RECREATE);
        doomedRef.current = null;
      }
      // A pending init destroys its application once it resolves.
      if (pendingRef.current === token && !provided) previousRef.current = settled;
      token.cancelled = true;
      pendingRef.current = null;
      if (appRef.current != null) {
        const stageOptions = provided
          ? null
          : recreating.current
            ? STAGE_OPTIONS_RECREATE
            : (latestProps.current.destroyOptions ?? STAGE_OPTIONS_UNMOUNT);
        previousRef.current = cleanupStage(pixi, appRef.current, stageOptions) ?? null;
        appRef.current = null;
        appliedProps.current = null;
      }
      recreating.current = false;
    };
  }, [canvasKey]);

  // Apply prop changes to an existing application. A pending init applies the latest props itself.
  useLayoutEffect(() => {
    const current = appRef.current;
    const prev = appliedProps.current;
    if (current == null || prev == null || prev === props) return;

    if (__DEV__ && prev.app !== props.app) {
      warnOnce(
        "appChange",
        "`app` prop of `Stage` changed after mount, which is not supported. Give `Stage` a new `key` to use another application."
      );
    }

    if (props.app != null) {
      rerenderStage(current, prev, props);
      appliedProps.current = props;
      return;
    }

    if (needsRecreate(prev.options, props.options)) {
      // Destroy this application and create one on a fresh canvas.
      // Destroying a renderer unbinds (PixiJS 6) or loses (PixiJS 7) the WebGL context of its canvas.
      recreating.current = true;
      setCanvasKey(key => key + 1);
      return;
    }

    rerenderStage(current, prev, props);
    resizeRenderer(current, prev, props);
    appliedProps.current = props;
  });

  if (app != null) return null;
  if (options && ((options as any).view || (options as any).canvas)) return null;
  return <canvas key={canvasKey} ref={canvasRef} {...getCanvasProps(props as Record<string, unknown>)} />;
}

const BridgelessStage = forwardRef(StageWithoutBridge);
const NO_CONTEXTS: never[] = [];

// The bridge sits around the application: the consumers of `bridgeContexts` render in the tree that owns `Stage`.
// A change to the number of contexts changes the tree shape and remounts the application, as a hook count would.
function Stage(props: StageProps, ref: Ref<StageRef>) {
  return (
    <ContextBridge
      contexts={props.bridgeContexts ?? NO_CONTEXTS}
      render={children => (
        <BridgelessStage ref={ref} {...props}>
          {children}
        </BridgelessStage>
      )}
    >
      {props.children as React.ReactNode}
    </ContextBridge>
  );
}

export default forwardRef(Stage) as unknown as StageComponent;
