import { getPixiAdapter } from "../configure";
import { getOwn, getStandardNames } from "../PixiProperty";
import { translate } from "../ReactPixiFiberComponent";
import { TAGS } from "../tags";
import { filterByKey, including } from "../utils";

// Stage's own props. `width` and `height` are deprecated, pass them in `options`.
export const STAGE_PROP_NAMES = [
  "app",
  "bridgeContexts",
  "destroyOptions",
  "options",
  "children",
  "onBeforeDestroy",
  "onInit",
  "width",
  "height",
] as const;
// The own props that also reach `app.stage`: the deprecated `width` and `height` size it.
const SHARED_STAGE_PROP_NAMES = ["width", "height"] as const;
const includingStageProps = including(STAGE_PROP_NAMES as readonly string[]);
const includingSharedStageProps = including(SHARED_STAGE_PROP_NAMES as readonly string[]);

// Lazy: the adapter table is read on each call, not at import. A typed name matches as its lowercase table key
// (`buttonmode`, `onclick`) or its canonical name (`buttonMode`), so React DOM handlers such as `onClick` go to the
// canvas. An untyped name matches as written in `untypedContainer`.
function includingContainerProps() {
  const pixi = getPixiAdapter();
  const standardNames = getStandardNames(pixi);
  const isPlainContainerProp = including(pixi.properties.untypedContainer);
  return (key: string) =>
    getOwn(standardNames, key) != null || getOwn(standardNames, key.toLowerCase()) === key || isPlainContainerProp(key);
}
// Both split the adapter-translated props, so a prop the adapter renames is sorted by its translated name.
// An own prop stays off `app.stage` even if a PixiJS version adds a Container property of the same name.
export const getContainerProps = (props: Record<string, unknown>) => {
  const isContainerProp = includingContainerProps();
  return filterByKey(
    translate(TAGS.Container, props),
    key => isContainerProp(key) && (!includingStageProps(key) || includingSharedStageProps(key))
  );
};
export const getCanvasProps = (props: Record<string, unknown>) => {
  const isContainerProp = includingContainerProps();
  return filterByKey(translate(TAGS.Container, props), key => !isContainerProp(key) && !includingStageProps(key));
};
