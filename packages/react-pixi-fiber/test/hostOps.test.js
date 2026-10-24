import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as PIXI from "pixi.js";
import { strictModeBit } from "@react-pixi-fiber/react-18";
import * as hostOps from "../src/hostOps";
import { validateProperties as validateUnknownProperties } from "../src/ReactPixiFiberUnknownPropertyHook";
import { createRegisteredInstance, normalizeBehavior } from "../src/registry";
import { TAGS } from "../src/tags";
import { findStrictRoot } from "../src/utils";

vi.mock("../src/utils", async importOriginal => ({
  ...(await importOriginal()),
  findStrictRoot: vi.fn(),
}));
vi.mock("../src/ReactPixiFiberUnknownPropertyHook", async importOriginal => ({
  ...(await importOriginal()),
  validateProperties: vi.fn(),
}));

describe("hostOps", () => {
  describe("appendChild", () => {
    const parent = {
      addChild: vi.fn(),
      removeChild: vi.fn(),
    };
    const child = { id: 1 };

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("removes child from parentInstance", () => {
      hostOps.appendChild(parent, child);

      expect(parent.removeChild).toHaveBeenCalledTimes(1);
      expect(parent.removeChild).toHaveBeenCalledWith(child);
    });

    it("adds child to parentInstance", () => {
      hostOps.appendChild(parent, child);

      expect(parent.addChild).toHaveBeenCalledTimes(1);
      expect(parent.addChild).toHaveBeenCalledWith(child);
    });

    it("calls afterAdd of a registered child", () => {
      const afterAdd = vi.fn();
      const child = createRegisteredInstance(
        "T",
        normalizeBehavior("T", { create: () => ({}), afterAdd }),
        {},
        () => {}
      );
      hostOps.appendChild(parent, child);

      expect(afterAdd).toHaveBeenCalledTimes(1);
      expect(afterAdd).toHaveBeenCalledWith(child);
    });
  });

  describe("afterAdd on a move", () => {
    const create = () => {
      const afterAdd = vi.fn();
      const beforeRemove = vi.fn();
      const behavior = normalizeBehavior("T", { create: () => new PIXI.Container(), afterAdd, beforeRemove });
      return { afterAdd, beforeRemove, child: createRegisteredInstance("T", behavior, {}, () => {}) };
    };

    it("appendChild of a child already in the parent moves it without afterAdd or beforeRemove", () => {
      const parent = new PIXI.Container();
      const a = create();
      const b = create();
      hostOps.appendChild(parent, a.child);
      hostOps.appendChild(parent, b.child);
      hostOps.appendChild(parent, a.child);
      expect(parent.children).toEqual([b.child, a.child]);
      expect(a.afterAdd).toHaveBeenCalledTimes(1);
      expect(a.beforeRemove).not.toHaveBeenCalled();
    });

    it("insertBefore of a child already in the parent moves it without afterAdd or beforeRemove", () => {
      const parent = new PIXI.Container();
      const a = create();
      const b = create();
      hostOps.appendChild(parent, a.child);
      hostOps.insertBefore(parent, b.child, a.child);
      expect(b.afterAdd).toHaveBeenCalledTimes(1);
      hostOps.insertBefore(parent, a.child, b.child);
      expect(parent.children).toEqual([a.child, b.child]);
      expect(a.afterAdd).toHaveBeenCalledTimes(1);
      expect(a.beforeRemove).not.toHaveBeenCalled();
    });

    it("calls afterAdd when the child comes from another parent", () => {
      const first = new PIXI.Container();
      const second = new PIXI.Container();
      const a = create();
      hostOps.appendChild(first, a.child);
      hostOps.appendChild(second, a.child);
      expect(second.children).toEqual([a.child]);
      expect(a.afterAdd).toHaveBeenCalledTimes(2);
    });
  });

  describe("removeChild", () => {
    const parent = {
      removeChild: vi.fn(),
    };
    const child = {
      destroy: vi.fn(),
      id: 1,
    };

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("removes child from parentInstance", () => {
      hostOps.removeChild(parent, child);

      expect(parent.removeChild).toHaveBeenCalledTimes(1);
      expect(parent.removeChild).toHaveBeenCalledWith(child);
    });

    it("delegates destruction to child", () => {
      hostOps.removeChild(parent, child);

      expect(child.destroy).toHaveBeenCalledTimes(1);
      expect(child.destroy).toHaveBeenCalledWith({ children: true });
    });

    it("calls beforeRemove of a registered child before removing it", () => {
      const beforeRemove = vi.fn(() => expect(parent.removeChild).not.toHaveBeenCalled());
      const child = createRegisteredInstance(
        "T",
        normalizeBehavior("T", { create: () => ({ destroy: vi.fn() }), beforeRemove }),
        {},
        () => {}
      );
      hostOps.removeChild(parent, child);

      expect(beforeRemove).toHaveBeenCalledTimes(1);
      expect(beforeRemove).toHaveBeenCalledWith(child);
      expect(parent.removeChild).toHaveBeenCalledWith(child);
    });
  });

  describe("insertBefore", () => {
    const child1 = {
      idx: 0,
    };
    const child2 = {
      idx: 1,
    };

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("adds child at specified index if child is already added to parent", () => {
      const parent = {
        addChildAt: vi.fn(),
        removeChild: vi.fn(),
        children: [child1, child2],
        getChildIndex: vi.fn(child => child.idx),
      };

      hostOps.insertBefore(parent, child1, child2);
      expect(parent.removeChild).toHaveBeenCalledTimes(1);
      expect(parent.removeChild).toHaveBeenCalledWith(child1);
      expect(parent.addChildAt).toHaveBeenCalledTimes(1);
      expect(parent.addChildAt).toHaveBeenCalledWith(child1, child2.idx);
    });

    it("adds child at specified index if child is not already added to parent", () => {
      const parent = {
        addChildAt: vi.fn(),
        removeChild: vi.fn(),
        children: [child2],
        getChildIndex: vi.fn(child => child.idx),
      };

      hostOps.insertBefore(parent, child1, child2);
      expect(parent.removeChild).not.toHaveBeenCalled();
      expect(parent.addChildAt).toHaveBeenCalledTimes(1);
      expect(parent.addChildAt).toHaveBeenCalledWith(child1, child2.idx);
    });

    it("calls afterAdd after inserting a registered instance", () => {
      const afterAdd = vi.fn();
      const behavior = normalizeBehavior("T", { create: () => ({ idx: 5 }), afterAdd });
      const child = createRegisteredInstance("T", behavior, {}, () => {});
      const parent = {
        addChildAt: vi.fn(),
        removeChild: vi.fn(),
        children: [child1],
        getChildIndex: vi.fn(child => child.idx),
      };
      hostOps.insertBefore(parent, child, child1);
      expect(afterAdd).toHaveBeenCalledWith(child);
      expect(parent.addChildAt).toHaveBeenCalledWith(child, 0);
    });

    it("throws if child and beforeChild is the same instance", () => {
      const parent = {};
      expect(() => hostOps.insertBefore(parent, child1, child1)).toThrow(
        "ReactPixiFiber cannot insert node before itself"
      );
    });
  });

  describe("a parent whose behavior owns its child operations", () => {
    const calls = [];
    const displayObjectMethods = () => ({
      addChild: vi.fn(),
      addChildAt: vi.fn(),
      children: [],
      getChildIndex: vi.fn(),
      removeChild: vi.fn(),
    });
    const createParent = () =>
      createRegisteredInstance(
        "P",
        normalizeBehavior("P", {
          appendChild: (parent, child) => calls.push(["appendChild", parent, child]),
          create: displayObjectMethods,
          insertBefore: (parent, child, before) => calls.push(["insertBefore", parent, child, before]),
          removeChild: (parent, child) => calls.push(["removeChild", parent, child]),
        }),
        {},
        () => {}
      );
    const createChild = () =>
      createRegisteredInstance(
        "C",
        normalizeBehavior("C", {
          afterAdd: child => calls.push(["afterAdd", child]),
          beforeRemove: child => calls.push(["beforeRemove", child]),
          create: () => ({}),
        }),
        {},
        () => {}
      );
    const expectNoDisplayObjectCalls = parent => {
      for (const method of ["addChild", "addChildAt", "getChildIndex", "removeChild"])
        expect(parent[method], method).not.toHaveBeenCalled();
    };

    beforeEach(() => {
      calls.length = 0;
    });

    it("appendChild calls the op, then afterAdd", () => {
      const parent = createParent();
      const child = createChild();
      hostOps.appendChild(parent, child);
      expect(calls).toEqual([
        ["appendChild", parent, child],
        ["afterAdd", child],
      ]);
      expectNoDisplayObjectCalls(parent);
    });

    it("insertBefore calls the op, then afterAdd", () => {
      const parent = createParent();
      const child = createChild();
      const before = createChild();
      hostOps.insertBefore(parent, child, before);
      expect(calls).toEqual([
        ["insertBefore", parent, child, before],
        ["afterAdd", child],
      ]);
      expectNoDisplayObjectCalls(parent);
    });

    it("a child the parent ops already hold is moved, not added, by appendChild and insertBefore", () => {
      const parent = createParent();
      const child = createChild();
      const other = createChild();
      hostOps.appendChild(parent, child);
      hostOps.appendChild(parent, other);
      hostOps.appendChild(parent, child);
      hostOps.insertBefore(parent, child, other);
      expect(calls.filter(([name]) => name === "afterAdd")).toEqual([
        ["afterAdd", child],
        ["afterAdd", other],
      ]);
    });

    it("a child removed through the parent ops is added again", () => {
      const parent = createParent();
      const child = createChild();
      hostOps.appendChild(parent, child);
      hostOps.removeChild(parent, child);
      hostOps.appendChild(parent, child);
      expect(calls.filter(([name]) => name === "afterAdd")).toEqual([
        ["afterAdd", child],
        ["afterAdd", child],
      ]);
    });

    it("removeChild calls beforeRemove, then the op, and skips destroy on a child without one", () => {
      const parent = createParent();
      const child = createChild();
      expect(() => hostOps.removeChild(parent, child)).not.toThrow();
      expect(calls).toEqual([
        ["beforeRemove", child],
        ["removeChild", parent, child],
      ]);
      expectNoDisplayObjectCalls(parent);
    });

    it("removeChild still destroys a child that has destroy", () => {
      const parent = createParent();
      const child = { destroy: vi.fn() };
      hostOps.removeChild(parent, child);
      expect(calls).toEqual([["removeChild", parent, child]]);
      expect(child.destroy).toHaveBeenCalledWith({ children: true });
    });
  });

  describe("clearContainer", () => {
    it("removes all children of the container", () => {
      const container = { removeChildren: vi.fn() };
      hostOps.clearContainer(container);
      expect(container.removeChildren).toHaveBeenCalledTimes(1);
    });

    it("does nothing without a container", () => {
      expect(() => hostOps.clearContainer(null)).not.toThrow();
    });
  });

  describe("hideInstance", () => {
    it("makes the instance invisible", () => {
      const instance = { visible: true };
      hostOps.hideInstance(instance);
      expect(instance.visible).toBe(false);
    });
  });

  describe("unhideInstance", () => {
    it("restores the visible prop", () => {
      const instance = { visible: false };
      hostOps.unhideInstance(instance, { visible: false });
      expect(instance.visible).toBe(false);
    });

    it("makes the instance visible without a visible prop", () => {
      const instance = { visible: false };
      hostOps.unhideInstance(instance, {});
      expect(instance.visible).toBe(true);
    });
  });

  describe("validateProperties", () => {
    afterEach(() => {
      findStrictRoot.mockReset();
      validateUnknownProperties.mockClear();
    });

    it("validates properties under a strict root in development", () => {
      const internalHandle = {};
      const props = { text: "42" };
      findStrictRoot.mockImplementation(() => ({}));
      hostOps.validateProperties(TAGS.Text, props, internalHandle);

      if (__DEV__) {
        expect(findStrictRoot).toHaveBeenCalledWith(internalHandle, strictModeBit);
        expect(validateUnknownProperties).toHaveBeenCalledTimes(1);
        expect(validateUnknownProperties).toHaveBeenCalledWith("Text", props);
      } else {
        expect(validateUnknownProperties).toHaveBeenCalledTimes(0);
      }
    });

    it("does not validate properties without a strict root", () => {
      findStrictRoot.mockImplementation(() => null);
      hostOps.validateProperties(TAGS.Text, { text: "42" }, {});
      expect(validateUnknownProperties).not.toHaveBeenCalled();
    });
  });

  describe("fragment instance", () => {
    const node = name => ({ getBounds: vi.fn(() => ({ name })), name, off: vi.fn(), on: vi.fn() });

    function fragment() {
      const children = [node("a"), node("b")];
      return { children, instance: hostOps.createFragmentInstance(() => children) };
    }

    it("reads its children on each access", () => {
      const { children, instance } = fragment();
      expect(instance.children).toEqual(children);
      const c = node("c");
      children.push(c);
      expect(instance.children).toEqual([...children]);
    });

    it("adds a listener to current children and to children added later", () => {
      const { children, instance } = fragment();
      const fn = vi.fn();
      instance.on("pointerdown", fn);
      instance.on("pointerdown", fn);
      for (const child of children) {
        expect(child.on).toHaveBeenCalledTimes(1);
        expect(child.on).toHaveBeenCalledWith("pointerdown", fn);
      }

      const c = node("c");
      hostOps.commitNewChildToFragmentInstance(c, instance);
      expect(c.on).toHaveBeenCalledWith("pointerdown", fn);
    });

    it("removes a listener before adding it to a child reported again", () => {
      const { instance } = fragment();
      const fn = vi.fn();
      instance.on("pointerdown", fn);
      const c = node("c");
      hostOps.commitNewChildToFragmentInstance(c, instance);
      hostOps.commitNewChildToFragmentInstance(c, instance);
      expect(c.off).toHaveBeenCalledTimes(2);
      expect(c.on).toHaveBeenCalledTimes(2);
      expect(c.off.mock.invocationCallOrder[1]).toBeLessThan(c.on.mock.invocationCallOrder[1]);
    });

    it("removes a listener from current children and stops adding it to children added later", () => {
      const { children, instance } = fragment();
      const fn = vi.fn();
      instance.on("pointerdown", fn);
      instance.off("pointerdown", fn);
      for (const child of children) expect(child.off).toHaveBeenCalledWith("pointerdown", fn);

      const c = node("c");
      hostOps.commitNewChildToFragmentInstance(c, instance);
      expect(c.on).not.toHaveBeenCalled();
    });

    it("removes its listeners from a deleted child", () => {
      const { children, instance } = fragment();
      const fn = vi.fn();
      instance.on("pointerdown", fn);
      hostOps.deleteChildFromFragmentInstance(children[0], instance);
      expect(children[0].off).toHaveBeenCalledWith("pointerdown", fn);
    });

    it("skips a child without on and off", () => {
      const particle = {};
      const { children, instance } = fragment();
      children.push(particle);
      const fn = vi.fn();
      expect(() => instance.on("pointerdown", fn)).not.toThrow();
      expect(() => hostOps.commitNewChildToFragmentInstance(particle, instance)).not.toThrow();
      expect(() => hostOps.deleteChildFromFragmentInstance(particle, instance)).not.toThrow();
      expect(() => instance.off("pointerdown", fn)).not.toThrow();
      expect(children[0].on).toHaveBeenCalledWith("pointerdown", fn);
      expect(children[0].off).toHaveBeenCalledWith("pointerdown", fn);
    });

    it("maps getBounds over the children", () => {
      const { instance } = fragment();
      expect(instance.getBounds()).toEqual([{ name: "a" }, { name: "b" }]);
    });

    it("skips a child without getBounds", () => {
      const bounds = { name: "b" };
      const instance = hostOps.createFragmentInstance(() => [{}, { getBounds: () => bounds }]);
      expect(instance.getBounds()).toEqual([bounds]);
    });

    it("reaches a PixiJS Display Object with on, once after it is reported again", () => {
      const container = new PIXI.Container();
      const instance = hostOps.createFragmentInstance(() => [container]);
      const fn = vi.fn();
      instance.on("pointerdown", fn);
      hostOps.commitNewChildToFragmentInstance(container, instance);
      container.emit("pointerdown", 42);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(42);
      instance.off("pointerdown", fn);
      container.emit("pointerdown", 43);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
