import type { ReactNode } from "react";

import { getConfigured, markRendered } from "./configure";
import type { Renderer } from "./types";
import warning from "./warning";

type Kind = "primary" | "secondary";

// The renderer that rendered each container. A tree rendered before a second `configure` call keeps updating and
// unmounting on its own reconciler; each renderer only knows the roots it created.
const owners: Record<Kind, WeakMap<object, Renderer>> = { primary: new WeakMap(), secondary: new WeakMap() };

// Lazy: the React adapter is resolved on each call, so importing the core instantiates no reconciler.
export function renderWith(kind: Kind, element: ReactNode, container: any, callback?: () => void): unknown {
  const renderer = owners[kind].get(container) || getConfigured()[kind];
  owners[kind].set(container, renderer);
  markRendered();
  return renderer.render(element, container, callback);
}

export function unmountWith(kind: Kind, container: any): boolean {
  const owner = owners[kind].get(container);
  if (__DEV__) warning(owner, "ReactPixiFiber did not render into container provided");
  return owner ? owner.unmount(container) : false;
}

export function render(element: ReactNode, container: any, callback?: () => void): unknown {
  return renderWith("primary", element, container, callback);
}

export function unmount(container: any): boolean {
  return unmountWith("primary", container);
}
