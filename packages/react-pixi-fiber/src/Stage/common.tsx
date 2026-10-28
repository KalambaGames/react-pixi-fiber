import type { PixiAdapter, PixiApplication } from "../types";
import React from "react";
import { AppProvider } from "../AppProvider";
import { diffProperties, setInitialProperties, updateProperties } from "../ReactPixiFiberComponent";
import { renderWith, unmountWith } from "../render";
import { getContainerProps } from "./props";
import { TAGS } from "../tags";

// React Pixi Fiber renderer is secondary to React DOM renderer when Stage is rendered by React DOM
export function render(element: React.ReactNode, container: any, callback?: () => void): unknown {
  return renderWith("secondary", element, container, callback);
}

export function unmount(container: any): void {
  unmountWith("secondary", container);
}

// Stage props as the helpers read them; the public shape is `StageProps` in `types.ts`.
export type Props = Record<string, any>;

// What `Stage` passes to `destroyApplication`. A recreate keeps the objects and textures on `app.stage` for the new
// application. The `destroyOptions` prop replaces the unmount value. A failed init always passes `true`.
export const STAGE_OPTIONS_RECREATE = false;
export const STAGE_OPTIONS_UNMOUNT = true;

// `null` unmounts the stage tree without destroying the application: a provided application is not ours to destroy.
// Otherwise returns a promise that settles once the application is destroyed, by `pixi`, the adapter that created it.
export function cleanupStage(
  pixi: PixiAdapter,
  app: PixiApplication,
  stageOptions: unknown,
  onBeforeDestroy?: (app: PixiApplication) => void
): Promise<void> | undefined {
  // Do not remove canvas from DOM, there are two ways canvas made it's way to PIXI.Application:
  // 1) canvas was rendered by Stage component - it will be removed by React when Stage is unmounted
  // 2) canvas was passed in options as `view` - removing canvas created externally may have unexpected consequences
  const removeView = false;

  // Unmount stage tree
  unmount(app.stage);

  if (stageOptions === null) return;

  // Give components a chance to finish unmounting before destroying PIXI.Application
  return new Promise(resolve => {
    setTimeout(() => {
      // A throw from `onBeforeDestroy` still destroys the application, then leaves the timeout.
      try {
        onBeforeDestroy?.(app);
      } finally {
        try {
          // Destroy PIXI.Application and what it rendered if necessary
          pixi.destroyApplication(app, removeView, stageOptions);
        } finally {
          resolve();
        }
      }
    }, 0);
  });
}

export function getDimensions(props: Props): [number | undefined, number | undefined] {
  const { height, width } = props.options || {};

  return [width, height];
}

export function renderApp(app: PixiApplication, props: Props): void {
  render(<AppProvider app={app}>{props.children}</AppProvider>, app.stage);
}

export function renderStage(app: PixiApplication, props: Props): void {
  // Determine what props to apply
  const stageProps = getContainerProps(props);

  setInitialProperties(TAGS.Container, app.stage, stageProps);
  renderApp(app, props);
}

export function rerenderStage(app: PixiApplication, oldProps: Props, newProps: Props): void {
  // Determine what has changed
  const oldStageProps = getContainerProps(oldProps);
  const newStageProps = getContainerProps(newProps);
  const updatePayload = diffProperties(TAGS.Container, app.stage, oldStageProps, newStageProps);

  if (updatePayload !== null) {
    updateProperties(TAGS.Container, app.stage, updatePayload);
  }

  renderApp(app, newProps);
}

export function resizeRenderer(app: PixiApplication, oldProps: Props, newProps: Props): void {
  const [oldWidth, oldHeight] = getDimensions(oldProps);
  const [newWidth, newHeight] = getDimensions(newProps);

  if (newHeight !== oldHeight || newWidth !== oldWidth) {
    // As in 2.x, a size removed from `options` passes undefined through to PixiJS.
    app.renderer.resize(newWidth as number, newHeight as number);
  }
}
