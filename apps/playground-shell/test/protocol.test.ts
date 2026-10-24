import { describe, expect, it } from "vitest";
import { isParentMessage, isRunnerMessage } from "../src/protocol";

describe("isParentMessage", () => {
  it("accepts run and rejects everything else", () => {
    expect(isParentMessage({ type: "run", runId: 1, code: "x" })).toBe(true);
    for (const bad of [null, "run", { type: "other" }, { type: "run", runId: 1 }, { type: "run", code: "x" }]) {
      expect(isParentMessage(bad)).toBe(false);
    }
  });
});

describe("isRunnerMessage", () => {
  it("accepts ready and console and rejects everything else", () => {
    expect(isRunnerMessage({ type: "ready" })).toBe(true);
    expect(isRunnerMessage({ type: "console", runId: 1, level: "warn", text: "t" })).toBe(true);
    for (const bad of [
      null,
      "ready",
      { type: "other" },
      { type: "console", runId: 1, text: "t" },
      { type: "console", runId: 1, level: "debug", text: "t" },
      { type: "console", level: "log", text: "t" },
    ]) {
      expect(isRunnerMessage(bad)).toBe(false);
    }
  });
});
