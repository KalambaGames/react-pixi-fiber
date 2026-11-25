---
"@react-pixi-fiber/react-17": minor
"@react-pixi-fiber/react-18": minor
"@react-pixi-fiber/react-19": minor
"react-pixi-fiber": minor
---

A behavior can have `afterMount(displayObject, props)`. It runs when React commits a new Display Object, after `afterAdd`, once for each Display Object. Inside a hidden `<Activity>`, it runs when React shows the Display Object. Start a ticker callback or a timer there: React can drop a render without a commit, and then `beforeRemove` never runs. The React adapters call the new `HostOps.commitMount`, so they need a core that has it. In development, the core warns once when a React adapter does not call it.
