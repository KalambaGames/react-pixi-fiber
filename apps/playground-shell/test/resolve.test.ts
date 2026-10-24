// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { type Example, resolve } from "../src/parent/Playground";
import { encodeCode, hashCode } from "../src/share";
import { createStore } from "../src/storage";
import { memoryStorage } from "./memoryStorage";

const example = (id: string): Example => ({
  code: `${id} original`,
  configure: { code: "", summary: "" },
  group: "Scene Objects",
  id,
  runner: "runner.html",
  title: id,
});
const examples = [example("first"), example("second")];

afterEach(() => window.history.replaceState(null, "", "#"));

describe("resolve", () => {
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
    expect(resolved.notices).toEqual([
      "The last run of this code did not finish. Edit the code to run it again, or press Reset to load the original example.",
    ]);
    store.reset("first");
    expect(await resolve(examples, store, window.location.hash)).toMatchObject({ held: false, notices: [] });
  });

  it("holds shared code back when its last run did not finish", async () => {
    const store = createStore(8, memoryStorage());
    store.markRunning("first");
    window.history.replaceState(null, "", `#first&code=${await encodeCode("while (true) {}")}`);
    const resolved = await resolve(examples, store, window.location.hash);
    expect(resolved).toMatchObject({ banner: "shared", code: "while (true) {}", held: true });
    expect(resolved.notices).toEqual([
      "The last run of this code did not finish. Edit the code to run it again, or press Reset to load the original example.",
    ]);
  });

  it("opens the first example without shared code for an unknown id", async () => {
    const store = createStore(8, memoryStorage());
    window.history.replaceState(null, "", "#unknown&code=garbage");
    const resolved = await resolve(examples, store, window.location.hash);
    expect(resolved).toMatchObject({ banner: null, code: "first original", example: { id: "first" }, notices: [] });
    expect(window.location.hash).toBe("#first");
  });
});
