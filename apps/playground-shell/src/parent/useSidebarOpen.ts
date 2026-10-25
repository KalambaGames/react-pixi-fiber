import { useState } from "react";
import { browserStorage } from "../storage";

const KEY = "playground:sidebar";

// Storage, not a cookie: a sandboxed page without `allow-same-origin` throws on `document.cookie`.
export function useSidebarOpen(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(() => browserStorage.get(KEY) !== "false");
  const update = (next: boolean) => {
    setOpen(next);
    browserStorage.set(KEY, next ? null : "false");
  };
  return [open, update];
}
