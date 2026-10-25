import { Component, createElement, type ComponentType, type ReactNode } from "react";
import { isParentMessage, type ConsoleLevel, type RunnerMessage } from "../protocol";
import { compile } from "./compile";
import { createModuleRequire } from "./modules";

export { compile } from "./compile";
export { createModuleRequire } from "./modules";

export function canRun(): boolean {
  return self.origin === "null";
}

const MAX_DEPTH = 2;

function isPlain(item: object): boolean {
  const prototype = Object.getPrototypeOf(item);
  return Array.isArray(item) || prototype === Object.prototype || prototype === null;
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack ? `${value.message}\n${value.stack}` : value.message;
  const ancestors: unknown[] = [];
  try {
    const text = JSON.stringify(value, function (this: unknown, _key, item: unknown) {
      if (typeof item === "bigint") return `${item}n`;
      if (typeof item === "function") return `[Function ${item.name || "anonymous"}]`;
      if (typeof item === "symbol") return item.toString();
      if (typeof item !== "object" || item === null) return item;
      const depth = ancestors.lastIndexOf(this) + 1;
      ancestors.length = depth;
      if (ancestors.includes(item)) return "[Circular]";
      if (depth > 0 && !isPlain(item)) return `[${item.constructor?.name || "Object"}]`;
      if (depth > MAX_DEPTH) return Array.isArray(item) ? "[Array]" : "[Object]";
      ancestors.push(item);
      return item;
    });
    return text ?? String(value);
  } catch {
    return String(value);
  }
}

function format(args: unknown[]): string {
  const [first, ...rest] = args;
  if (typeof first !== "string") return args.map(stringify).join(" ");
  const text = first.replace(/%([sdifoOc%])/g, (match, code: string) => {
    if (code === "%") return "%";
    if (rest.length === 0) return match;
    const value = rest.shift();
    if (code === "c") return "";
    // A native console prints NaN for a Symbol, where Number() throws.
    const number = typeof value === "symbol" ? Number.NaN : Number(value);
    if (code === "i") return String(Math.trunc(number));
    if (code === "d" || code === "f") return String(number);
    return stringify(value);
  });
  return [text, ...rest.map(stringify)].join(" ");
}

function post(message: RunnerMessage) {
  window.parent.postMessage(message, "*");
}

// React reports a caught render error through console.error, which sends it to the console.
class Boundary extends Component<{ children?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function startRunner(options: {
  modules: Record<string, unknown>;
  render: (Component: ComponentType) => void;
}): void {
  if (!canRun()) return;
  const require = createModuleRequire(options.modules);
  const parentOrigin = new URL(location.href).origin;
  let runId = 0;

  const send = (level: ConsoleLevel, text: string) => post({ type: "console", runId, level, text });

  for (const level of ["log", "info", "warn", "error"] as const) {
    const original = console[level];
    console[level] = (...args: unknown[]) => {
      original.apply(console, args);
      send(level, format(args));
    };
  }
  window.addEventListener("error", event => send("error", stringify(event.error ?? event.message)));
  window.addEventListener("unhandledrejection", event => send("error", stringify(event.reason)));

  window.addEventListener("message", event => {
    if (event.source !== window.parent || event.origin !== parentOrigin || !isParentMessage(event.data)) return;
    runId = event.data.runId;
    const compiled = compile(event.data.code);
    if (!compiled.ok) {
      const where = compiled.line === undefined ? "" : ` (line ${compiled.line}, column ${compiled.column})`;
      send("error", `${compiled.message}${where}`);
      return;
    }
    try {
      const exports: { default?: unknown } = {};
      new Function("require", "exports", compiled.code)(require, exports);
      const Example = exports.default;
      if (typeof Example !== "function") throw new Error("The example must export a React component as default.");
      options.render(() => createElement(Boundary, null, createElement(Example as ComponentType)));
    } catch (error) {
      send("error", stringify(error));
    }
  });

  post({ type: "ready" });
}
