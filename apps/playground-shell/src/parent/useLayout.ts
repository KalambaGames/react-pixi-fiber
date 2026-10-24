import { useState } from "react";
import { browserStorage } from "../storage";

export type Layout = "both" | "editor" | "preview" | "stacked";

const KEY = "playground:layout";

function stored(): Layout {
  const value = browserStorage.get(KEY);
  return value === "editor" || value === "preview" || value === "stacked" ? value : "both";
}

export function useLayout(): [Layout, (layout: Layout) => void] {
  const [layout, setLayout] = useState(stored);
  const update = (next: Layout) => {
    setLayout(next);
    browserStorage.set(KEY, next === "both" ? null : next);
  };
  return [layout, update];
}
