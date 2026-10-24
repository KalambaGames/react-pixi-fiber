import { describe, expect, it } from "vitest";
import { hashCode } from "../src/share";
import { createStore } from "../src/storage";
import { memoryStorage } from "./memoryStorage";

describe("createStore", () => {
  it("saves, loads, flags upstream changes and resets", () => {
    const store = createStore(8, memoryStorage());
    store.save("sprite", "edited", "original");
    expect(store.load("sprite", "original")).toEqual({
      changedUpstream: false,
      code: "edited",
      originalHash: hashCode("original"),
    });
    expect(store.load("sprite", "newer")).toEqual({
      changedUpstream: true,
      code: "edited",
      originalHash: hashCode("original"),
    });
    store.reset("sprite");
    expect(store.load("sprite", "original")).toBeNull();
  });

  it("keeps a given original hash so a stale edit stays flagged", () => {
    const store = createStore(8, memoryStorage());
    store.save("sprite", "edited", "newer", hashCode("original"));
    expect(store.load("sprite", "newer")?.changedUpstream).toBe(true);
  });

  it("keeps majors apart", () => {
    const storage = memoryStorage();
    createStore(8, storage).save("sprite", "eight", "o");
    expect(createStore(7, storage).load("sprite", "o")).toBeNull();
  });

  it("remembers a run that did not finish, per example", () => {
    const store = createStore(8, memoryStorage());
    expect(store.wasRunning("sprite")).toBe(false);
    store.markRunning("sprite");
    expect(store.wasRunning("sprite")).toBe(true);
    expect(store.wasRunning("text")).toBe(false);
    store.markRunning("text");
    store.clearRunning("sprite");
    expect(store.wasRunning("text")).toBe(true);
    store.clearRunning("text");
    expect(store.wasRunning("text")).toBe(false);
  });

  it("survives throwing and missing storage", () => {
    const boom = () => {
      throw new Error("denied");
    };
    const broken = { getItem: boom, setItem: boom, removeItem: boom } as unknown as Storage;
    for (const storage of [broken, null]) {
      const store = createStore(8, storage);
      expect(() => store.save("a", "b", "c")).not.toThrow();
      expect(() => store.reset("a")).not.toThrow();
      expect(store.load("a", "c")).toBeNull();
      expect(() => store.markRunning("a")).not.toThrow();
      expect(() => store.clearRunning("a")).not.toThrow();
      expect(store.wasRunning("a")).toBe(false);
    }
  });
});
