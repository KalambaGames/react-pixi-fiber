import React, { createContext, useContext } from "react";
import type { ComponentType, ReactNode } from "react";
import type { PixiApplication } from "./types";
import warning from "./warning";

export const AppContext = createContext<PixiApplication | null>(null);

export function AppProvider({ app, children }: { app: PixiApplication; children?: ReactNode }) {
  return <AppContext.Provider value={app}>{children}</AppContext.Provider>;
}

// Outside <Stage /> and <AppProvider /> the wrapped component gets `app={null}`, as in 2.x. In development, `withApp`
// writes a warning one time for each wrapped component.
export function withApp<P extends { app: PixiApplication }>(WrappedComponent: ComponentType<P>) {
  const displayName = `withApp(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  let warned = false;
  function WithApp(props: Omit<P, "app">) {
    const app = useContext(AppContext);
    if (__DEV__ && app === null && !warned) {
      warned = true;
      warning(
        false,
        "`%s` gets no PIXI.Application, so its `app` prop is null. Render it in a child of <Stage /> or <AppProvider />.",
        displayName
      );
    }
    return <WrappedComponent {...(props as P)} app={app} />;
  }
  WithApp.displayName = displayName;
  return WithApp;
}
