---
"react-pixi-fiber": patch
---

The core restores the default of a prop set to `undefined` before it writes the other props, as it already does for a removed prop. So the restore cannot undo a value that a sibling prop wrote. For example, when `<Sprite scale={2} />` becomes `<Sprite width={100} scale={undefined} />`, the Sprite keeps the width of 100. At mount the core does not write a default onto a new instance.
