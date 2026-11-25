---
"react-pixi-fiber": minor
---

A behavior can have `afterMove(displayObject)`. It runs at commit when React moves a Display Object or a filter to a new place in the same parent, after the move. This includes a parent whose behavior has its own child operations. `afterAdd` and `beforeRemove` do not run for a move. Only the moved Display Object gets the call, and a sibling that React moves later in the same commit can still be in its old place.
