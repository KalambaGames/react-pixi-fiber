import invariant from "./invariant";
import { registerComponent } from "./registry";
import type { PIXIFilterBehavior, PIXIFilterProps, PixiComponent } from "./types";

// Register a filter. Returns `type`. An element of this type adds the filter to its parent's `filters`.
export function PIXIFilter<T extends object, P = {}>(
  type: string,
  behavior: PIXIFilterBehavior<T, P>
): PixiComponent<PIXIFilterProps<T, P>, T> {
  invariant(
    typeof type === "string",
    "Invalid argument `type` of type `%s` supplied to `PIXIFilter`, expected `string`. The signature is `PIXIFilter(type, behavior)`.",
    typeof type
  );
  const definition = typeof behavior === "function" ? { create: behavior } : behavior;
  return registerComponent(type, { ...definition, kind: "filter" }) as unknown as PixiComponent<
    PIXIFilterProps<T, P>,
    T
  >;
}
