export type ConsoleLevel = "log" | "info" | "warn" | "error";

export type ParentMessage = { type: "run"; runId: number; code: string };

export type RunnerMessage =
  | { type: "ready" }
  | { type: "console"; runId: number; level: ConsoleLevel; text: string }
  | { type: "started"; runId: number };

const levels: readonly unknown[] = ["log", "info", "warn", "error"];

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null;
}

export function isParentMessage(data: unknown): data is ParentMessage {
  return isRecord(data) && data.type === "run" && typeof data.runId === "number" && typeof data.code === "string";
}

export function isRunnerMessage(data: unknown): data is RunnerMessage {
  if (!isRecord(data)) return false;
  if (data.type === "ready") return true;
  if (data.type === "started") return typeof data.runId === "number";
  return (
    data.type === "console" &&
    typeof data.runId === "number" &&
    levels.includes(data.level) &&
    typeof data.text === "string"
  );
}
