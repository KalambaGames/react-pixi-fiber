import { useState } from "react";

export type Layout = "both" | "editor" | "preview";

const KEY = "playground:layout";

function stored(): Layout {
  try {
    const value = localStorage.getItem(KEY);
    return value === "editor" || value === "preview" ? value : "both";
  } catch {
    return "both";
  }
}

export function useLayout(): [Layout, (layout: Layout) => void] {
  const [layout, setLayout] = useState(stored);
  const update = (next: Layout) => {
    setLayout(next);
    try {
      if (next === "both") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
  };
  return [layout, update];
}
