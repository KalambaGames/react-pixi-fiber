import { Container3D, View3D } from "@pixi/3d";
import type { Behavior } from "react-pixi-fiber";

// `View3D.addChild` throws: the children of `<View3D>` are the scene, in `view.root`.
function check(child: unknown): asserts child is Container3D {
  if (!(child instanceof Container3D)) {
    throw new Error(
      "`View3D` takes only 3D nodes as children. Put a Display Object next to the view, for example a label after `<View3D>`."
    );
  }
}

export const viewBehavior: Behavior<View3D> = {
  create: () => new View3D(),
  appendChild: (view, child) => {
    check(child);
    view.root.addChild(child);
  },
  insertBefore: (view, child, before) => {
    check(child);
    view.root.addChildAt(child, view.root.getChildIndex(before as Container3D));
  },
  removeChild: (view, child) => {
    view.root.removeChild(child as Container3D);
  },
};
