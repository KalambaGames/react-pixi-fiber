import { describe, it, expect, vi } from "vitest";
import * as PIXI from "pixi.js";
import pixi6 from "@react-pixi-fiber/pixi-6";
import {
  filterByKey,
  findStrictRoot,
  including,
  isPointType,
  not,
  parsePoint,
  setPixiValue,
  copyPoint,
} from "../src/utils";

const adapter = pixi6();

describe("not", () => {
  it("returns a function", () => {
    expect(typeof not()).toEqual("function");
  });

  it("calls wrapped function when called", () => {
    const fn = vi.fn();
    not(fn)();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("negates wrapped function return value", () => {
    const returnTrue = vi.fn(() => true);
    const returnFalse = vi.fn(() => false);

    expect(not(returnTrue)()).toBeFalsy();
    expect(not(returnFalse)()).toBeTruthy();
  });
});

describe("filterByKey", () => {
  it("should return an object when called with object and function", () => {
    expect(typeof filterByKey({}, vi.fn())).toEqual("object");
  });

  it("should return an object with keys matching filter only", () => {
    const obj = {
      foo: 1,
      bar: 2,
      baz: 3,
    };
    const fooOnly = vi.fn(key => key === "foo");
    const withoutFoo = vi.fn(key => key !== "foo");

    expect(filterByKey(obj, fooOnly)).toEqual({
      foo: 1,
    });
    expect(fooOnly).toHaveBeenCalledTimes(Object.keys(obj).length);

    expect(filterByKey(obj, withoutFoo)).toEqual({
      bar: 2,
      baz: 3,
    });
    expect(withoutFoo).toHaveBeenCalledTimes(Object.keys(obj).length);
  });
});

describe("including", () => {
  it("returns a function", () => {
    expect(typeof including()).toEqual("function");
  });

  it("returns true if wrapped array contains value", () => {
    const havingFoo = { foo: "bar" };

    expect(including(Object.keys(havingFoo))("foo")).toBeTruthy();
  });

  it("returns false if wrapped array does not contain value", () => {
    const notHavingBaz = ["foo", "bar"];

    expect(including(Object.keys(notHavingBaz))("baz")).toBeFalsy();
  });
});

describe("parsePoint", () => {
  it("returns array", () => {
    expect(parsePoint()).toHaveLength(0);
  });

  it("returns array of strings split by comma if value is a string", () => {
    expect(parsePoint("13,37")).toEqual([13, 37]);
  });

  it("returns array with single number if value is a number", () => {
    expect(parsePoint(42)).toEqual([42]);
  });

  it("returns copy of an array if value is an array", () => {
    expect(parsePoint([100, 10])).toEqual([100, 10]);
  });

  it("returns array with x and y from object if value is an object with x and y members", () => {
    expect(parsePoint({ x: 1, y: 0 })).toEqual([1, 0]);
  });

  it("returns empty array otherwise", () => {
    expect(parsePoint(false)).toEqual([]);
  });
});

describe("isPointType", () => {
  const x = 100;
  const y = 50;

  it("returns true if value is instance of PIXI.Point", () => {
    expect(isPointType(new PIXI.Point(x, y), adapter)).toBeTruthy();
  });
  it("returns true if value is instance of PIXI.ObservablePoint", () => {
    expect(isPointType(new PIXI.ObservablePoint(vi.fn, null, x, y), adapter)).toBeTruthy();
  });
  it("returns false if value is not instance of PIXI.Point or PIXI.ObservablePoint", () => {
    expect(isPointType(`${x},${y}`, adapter)).toBeFalsy();
  });
});

describe("setPixiValue", () => {
  it("copies value if current and next value are point types", () => {
    class JestPoint extends PIXI.Point {}
    JestPoint.prototype.copyFrom = vi.fn(PIXI.Point.prototype.copyFrom);
    const obj = {
      test: new JestPoint(0, 0),
    };
    const test = new PIXI.Point(13, 37);

    setPixiValue(obj, "test", test, adapter);
    expect(JestPoint.prototype.copyFrom).toHaveBeenCalledTimes(1);
    expect(JestPoint.prototype.copyFrom).toHaveBeenCalledWith(test);
    expect(obj.test).toEqual(new PIXI.Point(13, 37));
  });

  it("parses next value and sets current if only current value is point", () => {
    class JestPoint extends PIXI.Point {}
    JestPoint.prototype.set = vi.fn(PIXI.Point.prototype.set);
    const obj = {
      test: new JestPoint(0, 0),
    };
    setPixiValue(obj, "test", "13,37", adapter);
    expect(JestPoint.prototype.set).toHaveBeenCalledTimes(1);
    expect(JestPoint.prototype.set).toHaveBeenCalledWith(13, 37);
    expect(obj.test).toEqual(new PIXI.Point(13, 37));
  });

  it("assigns value directly if neither current nor next value are point types", () => {
    const obj = {};
    const value = "value";
    expect(obj.test).not.toEqual(value);
    setPixiValue(obj, "test", value, adapter);
    expect(obj.test).toEqual(value);
  });

  it("assigns null to a point prop, so the PixiJS setter decides whether it accepts it", () => {
    const obj = {
      test: new PIXI.Point(0, 0),
    };
    setPixiValue(obj, "test", null, adapter);
    expect(obj.test).toBeNull();
  });
});

describe("copyPoint", () => {
  it("copies the value into the current point through the adapter", () => {
    const pixi = { copyPoint: vi.fn() };
    const instance = { position: new PIXI.Point(0, 0) };
    const position = new PIXI.Point(13, 37);

    copyPoint(instance, "position", position, pixi);
    expect(pixi.copyPoint).toHaveBeenCalledTimes(1);
    expect(pixi.copyPoint).toHaveBeenCalledWith(instance.position, position);
  });
});

describe("findStrictRoot", () => {
  it("returns the outermost fiber that has the StrictMode bit", () => {
    const root = { mode: 8, return: null };
    const middle = { mode: 8, return: root };
    const leaf = { mode: 0, return: middle };
    expect(findStrictRoot(leaf, 8)).toBe(root);
  });

  it("returns null when no fiber has the bit", () => {
    expect(findStrictRoot({ mode: 0, return: { mode: 0, return: null } }, 8)).toBeNull();
    expect(findStrictRoot(undefined, 8)).toBeNull();
  });

  it("uses the bit it is given", () => {
    const fiber = { mode: 1, return: null };
    expect(findStrictRoot(fiber, 1)).toBe(fiber);
    expect(findStrictRoot(fiber, 8)).toBeNull();
  });
});
