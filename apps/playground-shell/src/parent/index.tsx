import { createRoot } from "react-dom/client";
import "./index.css";
import { type Example, Playground } from "./Playground";

export { ConsolePanel } from "./ConsolePanel";
export type { Example, ExampleGroup } from "./Playground";
export { Preview } from "./Preview";
export { setup } from "./setup";
export { type ConsoleEntry, useRunner } from "./useRunner";

export function mountPlayground({
  examples,
  pixiMajor,
  root,
}: {
  examples: Example[];
  pixiMajor: number;
  root: HTMLElement;
}): void {
  createRoot(root).render(<Playground examples={examples} pixiMajor={pixiMajor} />);
}
