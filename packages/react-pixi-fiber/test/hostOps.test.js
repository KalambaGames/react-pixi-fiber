import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as PIXI from "pixi.js";
import { strictModeBit } from "@react-pixi-fiber/react-18";
import { recordDefault } from "../src/defaults";
import { hasFilterChildren } from "../src/filters";
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

  describe("filter children", () => {
    const filterInstance = (tag = "F", behavior = {}) =>
      createRegisteredInstance(
        tag,
        normalizeBehavior(tag, { create: () => ({ destroy: vi.fn(), enabled: true }), kind: "filter", ...behavior }),
        {},
        () => {}
      );

    // Identity per index: `toEqual` takes two empty Containers as equal.
    const expectOrder = (actual, expected) => {
      expect(actual).toHaveLength(expected.length);
      expected.forEach((item, i) => expect(actual[i]).toBe(item));
    };

    let parent;
    beforeEach(() => {
      parent = new PIXI.Container();
    });

    it("appends a filter child to parent.filters in order and never to children", () => {
      const a = filterInstance();
      const b = filterInstance();
      hostOps.appendChild(parent, a);
      hostOps.appendChild(parent, b);
      expectOrder(parent.filters, [a, b]);
      expect(parent.children).toHaveLength(0);
    });

    it("inserts a filter before a filter and before a display object", () => {
      const c1 = new PIXI.Container();
      const c2 = new PIXI.Container();
      const fA = filterInstance();
      const fB = filterInstance();
      const fC = filterInstance();
      hostOps.appendChild(parent, c1);
      hostOps.appendChild(parent, fA);
      hostOps.appendChild(parent, c2);
      hostOps.insertBefore(parent, fB, c2);
      expectOrder(parent.filters, [fA, fB]);
      hostOps.insertBefore(parent, fC, fA);
      expectOrder(parent.filters, [fC, fA, fB]);
      expectOrder(parent.children, [c1, c2]);
    });

    it("inserts a display object before a filter at the next display sibling", () => {
      const c1 = new PIXI.Container();
      const c2 = new PIXI.Container();
      const c3 = new PIXI.Container();
      const fA = filterInstance();
      hostOps.appendChild(parent, c1);
      hostOps.appendChild(parent, fA);
      hostOps.appendChild(parent, c2);
      hostOps.insertBefore(parent, c3, fA);
      expectOrder(parent.children, [c1, c3, c2]);
      expectOrder(parent.filters, [fA]);
      hostOps.insertBefore(parent, c2, fA);
      expectOrder(parent.children, [c1, c3, c2]);
      const c4 = new PIXI.Container();
      hostOps.insertBefore(parent, c4, fA);
      expectOrder(parent.children, [c1, c3, c2, c4]);
    });

    it("appends a display object inserted before a last filter", () => {
      const c1 = new PIXI.Container();
      const c2 = new PIXI.Container();
      const fA = filterInstance();
      hostOps.appendChild(parent, c1);
      hostOps.appendChild(parent, fA);
      hostOps.insertBefore(parent, c2, fA);
      expectOrder(parent.children, [c1, c2]);
    });

    it("keeps display order on a reorder around a filter", () => {
      const c1 = new PIXI.Container();
      const c2 = new PIXI.Container();
      const fA = filterInstance();
      const fB = filterInstance();
      hostOps.appendChild(parent, c1);
      hostOps.appendChild(parent, fA);
      hostOps.appendChild(parent, c2);
      hostOps.insertBefore(parent, c2, c1);
      expectOrder(parent.children, [c2, c1]);
      expectOrder(parent.filters, [fA]);
      hostOps.insertBefore(parent, fB, c1);
      expectOrder(parent.filters, [fB, fA]);
    });

    it("throws for a filter child of a parent without a filters property", () => {
      const plain = createRegisteredInstance("Plain", normalizeBehavior("Plain", { create: () => ({}) }), {}, () => {});
      expect(() => hostOps.appendChild(plain, filterInstance())).toThrow(
        "`<Plain />` has no `filters` property, so it cannot hold filter children."
      );
    });

    it("seeds the order from the children a parent holds before its first filter", () => {
      const c1 = new PIXI.Container();
      const fA = filterInstance();
      const fB = filterInstance();
      parent.addChild(c1);
      hostOps.appendChild(parent, fA);
      hostOps.insertBefore(parent, fB, c1);
      expectOrder(parent.filters, [fB, fA]);
    });

    // Ops that keep the children outside `children`.
    const keeper = () => {
      const ops = { appendChild: vi.fn(), insertBefore: vi.fn(), removeChild: vi.fn() };
      return createRegisteredInstance(
        "Keeper",
        normalizeBehavior("Keeper", { create: () => new PIXI.Container(), ...ops }),
        {},
        () => {}
      );
    };

    it("seeds the order from the children a parent holds through its own ops", () => {
      const owner = keeper();
      const c1 = new PIXI.Container();
      const fA = filterInstance();
      const fB = filterInstance();
      hostOps.appendChild(owner, c1);
      hostOps.appendChild(owner, fB);
      hostOps.insertBefore(owner, fA, c1);
      expectOrder(owner.filters, [fA, fB]);
    });

    it("seeds the order from the held children as they are after a move to the end", () => {
      const owner = keeper();
      const a = new PIXI.Container();
      const b = new PIXI.Container();
      const f1 = filterInstance();
      const f2 = filterInstance();
      hostOps.appendChild(owner, a);
      hostOps.appendChild(owner, b);
      hostOps.appendChild(owner, a);
      hostOps.insertBefore(owner, f1, b);
      hostOps.insertBefore(owner, f2, a);
      expectOrder(owner.filters, [f1, f2]);
    });

    it("seeds the order from the held children as they are after a move before a sibling", () => {
      const owner = keeper();
      const a = new PIXI.Container();
      const b = new PIXI.Container();
      const f1 = filterInstance();
      const f2 = filterInstance();
      hostOps.appendChild(owner, a);
      hostOps.appendChild(owner, b);
      hostOps.insertBefore(owner, b, a);
      hostOps.insertBefore(owner, f1, b);
      hostOps.insertBefore(owner, f2, a);
      expectOrder(owner.filters, [f1, f2]);
    });

    it("moves a filter without calling afterAdd again", () => {
      const afterAdd = vi.fn();
      const c1 = new PIXI.Container();
      const f = filterInstance("F", { afterAdd });
      hostOps.appendChild(parent, c1);
      hostOps.appendChild(parent, f);
      hostOps.appendChild(parent, f);
      hostOps.insertBefore(parent, f, c1);
      expect(afterAdd).toHaveBeenCalledTimes(1);
      expect(afterAdd).toHaveBeenCalledWith(f);
      expectOrder(parent.filters, [f]);
    });

    it("lands in parent.filters under a parent that owns its child operations", () => {
      const ops = { appendChild: vi.fn(), insertBefore: vi.fn(), removeChild: vi.fn() };
      const owner = createRegisteredInstance(
        "Owner",
        normalizeBehavior("Owner", { create: () => new PIXI.Container(), ...ops }),
        {},
        () => {}
      );
      const f = filterInstance();
      hostOps.appendChild(owner, f);
      expectOrder(owner.filters, [f]);
      hostOps.removeChild(owner, f);
      expect(owner.filters).toBeNull();
      expect(ops.appendChild).not.toHaveBeenCalled();
      expect(ops.removeChild).not.toHaveBeenCalled();
    });

    it("removes a filter: beforeRemove, list, destroy() without options, null when empty", () => {
      const beforeRemove = vi.fn();
      const a = filterInstance("F", { beforeRemove });
      const b = filterInstance();
      hostOps.appendChild(parent, a);
      hostOps.appendChild(parent, b);
      hostOps.removeChild(parent, a);
      expect(beforeRemove).toHaveBeenCalledWith(a);
      expect(beforeRemove.mock.invocationCallOrder[0]).toBeLessThan(a.destroy.mock.invocationCallOrder[0]);
      expect(a.destroy).toHaveBeenCalledWith();
      expectOrder(parent.filters, [b]);
      hostOps.removeChild(parent, b);
      expect(parent.filters).toBeNull();
      expect(hasFilterChildren(parent)).toBe(false);
    });

    it("forgets a removed display child", () => {
      const c1 = new PIXI.Container();
      const c2 = new PIXI.Container();
      const fA = filterInstance();
      const fB = filterInstance();
      hostOps.appendChild(parent, c1);
      hostOps.appendChild(parent, fA);
      hostOps.appendChild(parent, c2);
      hostOps.removeChild(parent, c2);
      hostOps.appendChild(parent, fB);
      expectOrder(parent.filters, [fA, fB]);
      expectOrder(parent.children, [c1]);
      const c3 = new PIXI.Container();
      hostOps.insertBefore(parent, c3, fA);
      expectOrder(parent.children, [c1, c3]);
    });

    it("drops the order of a cleared container", () => {
      hostOps.appendChild(parent, filterInstance());
      expect(hasFilterChildren(parent)).toBe(true);
      hostOps.clearContainer(parent);
      expect(hasFilterChildren(parent)).toBe(false);
    });

    it("throws when a filter gets a child", () => {
      expect(() => hostOps.appendChild(filterInstance("Glow"), new PIXI.Container())).toThrow(
        "`<Glow />` takes no children."
      );
    });

    it("hides a filter with enabled and restores the prop, the default, or true", () => {
      const f = filterInstance();
      hostOps.hideInstance(f);
      expect(f.enabled).toBe(false);
      expect("visible" in f).toBe(false);
      hostOps.unhideInstance(f, { enabled: false });
      expect(f.enabled).toBe(false);
      hostOps.unhideInstance(f, {});
      expect(f.enabled).toBe(true);

      const g = filterInstance();
      g.enabled = false;
      recordDefault(g, "enabled", () => false);
      hostOps.hideInstance(g);
      hostOps.unhideInstance(g, {});
      expect(g.enabled).toBe(false);
    });

    it("skips a filter in a fragment instance", () => {
      const f = filterInstance("F", { create: () => ({ off: vi.fn(), on: vi.fn() }) });
      const instance = hostOps.createFragmentInstance(() => [f]);
      const fn = () => {};
      instance.on("pointerdown", fn);
      instance.off("pointerdown", fn);
      hostOps.commitNewChildToFragmentInstance(f, instance);
      hostOps.deleteChildFromFragmentInstance(f, instance);
      expect(f.on).not.toHaveBeenCalled();
      expect(f.off).not.toHaveBeenCalled();
    });
  });
});
