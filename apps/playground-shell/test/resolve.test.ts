// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { type Example, resolve } from "../src/parent/Playground";
import { encodeCode, hashCode } from "../src/share";
import { createStore } from "../src/storage";
import { memoryStorage } from "./memoryStorage";

const example = (id: string): Example => ({
  configure: { code: "", summary: "" },
  group: "Scene Objects",
  id,
  load: async () => `${id} original`,
  runner: "runner.html",
  title: id,
});
const examples = [example("first"), example("second")];

afterEach(() => window.history.replaceState(null, "", "#"));

describe("resolve", () => {
  it("loads the example source and gives it as the original", async () => {
    window.history.replaceState(null, "", "#second");
    expect(await resolve(examples, createStore(8, memoryStorage()), window.location.hash)).toMatchObject({
      code: "second original",
      original: "second original",
    });
  });

  it("resolves an alias to its example and puts the current id in the address", async () => {
    const aliased = { ...example("features-second"), aliases: ["second"] };
    const encoded = await encodeCode("shared");
    window.history.replaceState(null, "", `#second&code=${encoded}`);
    const resolved = await resolve([example("first"), aliased], createStore(8, memoryStorage()), window.location.hash);
    expect(resolved).toMatchObject({ code: "shared", example: { id: "features-second" } });
    expect(window.location.hash).toBe(`#features-second&code=${encoded}`);
  });

  it("loads the source also for a shared link, for the stale check", async () => {
    window.history.replaceState(null, "", `#second&code=${await encodeCode("shared")}`);
    expect(await resolve(examples, createStore(8, memoryStorage()), window.location.hash)).toMatchObject({
      code: "shared",
      original: "second original",
    });
  });

  it("loads the saved edit when a share link cannot be read", async () => {
    const store = createStore(8, memoryStorage());
    store.save("second", "my edit", "older original");
    window.history.replaceState(null, "", "#second&code=garbage");
    const resolved = await resolve(examples, store, window.location.hash);
    expect(resolved).toMatchObject({
      banner: null,
      code: "my edit",
      example: { id: "second" },
      staleHash: hashCode("older original"),
    });
    expect(resolved.notices).toEqual(["This link holds code that cannot be read."]);
    expect(window.location.hash).toBe("#second");
  });

  it("holds saved code back when its last run did not finish", async () => {
    const store = createStore(8, memoryStorage());
    store.save("first", "while (true) {}", "first original");
    window.history.replaceState(null, "", "#first");
    expect(await resolve(examples, store, window.location.hash)).toMatchObject({ held: false, notices: [] });
    store.markRunning("first");
    const resolved = await resolve(examples, store, window.location.hash);
    expect(resolved).toMatchObject({ code: "while (true) {}", held: true });
    expect(resolved.notices).toEqual([]);
    store.reset("first");
    expect(await resolve(examples, store, window.location.hash)).toMatchObject({ held: false, notices: [] });
  });

  it("holds shared code back when its last run did not finish", async () => {
    const store = createStore(8, memoryStorage());
    store.markRunning("first");
    window.history.replaceState(null, "", `#first&code=${await encodeCode("while (true) {}")}`);
    const resolved = await resolve(examples, store, window.location.hash);
    expect(resolved).toMatchObject({ banner: "shared", code: "while (true) {}", held: true });
    expect(resolved.notices).toEqual([]);
  });

  it("opens the first example without shared code for an unknown id", async () => {
    const store = createStore(8, memoryStorage());
    window.history.replaceState(null, "", "#unknown&code=garbage");
    const resolved = await resolve(examples, store, window.location.hash);
    expect(resolved).toMatchObject({ banner: null, code: "first original", example: { id: "first" }, notices: [] });
    expect(window.location.hash).toBe("#first");
  });
});
