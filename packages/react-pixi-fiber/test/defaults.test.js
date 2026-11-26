import { describe, expect, it } from "vitest";

import { getRecordedDefault, recordDefault } from "../src/defaults";

const isPoint = v => v != null && typeof v === "object" && "isFakePoint" in v;

describe("defaults", () => {
  it("records the current value once, before the first write", () => {
    const instance = { alpha: 1 };
    recordDefault(instance, "alpha", isPoint);
    instance.alpha = 0.5;
    recordDefault(instance, "alpha", isPoint);
    expect(getRecordedDefault(instance, "alpha")).toBe(1);
    expect(getRecordedDefault(instance, "x")).toBeUndefined();
  });
  it("copies a point as a plain { x, y }", () => {
    const point = { isFakePoint: true, x: 1, y: 2 };
    const instance = { scale: point };
    recordDefault(instance, "scale", isPoint);
    point.x = 9;
    expect(getRecordedDefault(instance, "scale")).toEqual({ x: 1, y: 2 });
  });
});
