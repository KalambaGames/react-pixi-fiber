import { createRoot } from "react-dom/client";
import "./index.css";
import { Playground, type Example } from "./Playground";

export { ConsolePanel } from "./ConsolePanel";
export { Preview } from "./Preview";
export { setup } from "./setup";
export { useRunner, type ConsoleEntry } from "./useRunner";
export type { Example, ExampleGroup } from "./Playground";

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
