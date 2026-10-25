import { useEffect, useRef, useState, type RefObject } from "react";
import { isRunnerMessage, type ParentMessage, type RunnerMessage } from "../protocol";

const MAX_ENTRIES = 500;
const READY_TIMEOUT_MS = 5000;

export type ConsoleEntry = { level: Extract<RunnerMessage, { type: "console" }>["level"] | "system"; text: string };

export function useRunner(
  _runnerUrl: string,
  code: string,
  { delayMs = 500, held = false, onRun }: { delayMs?: number; held?: boolean; onRun?: () => void } = {}
): {
  entries: ConsoleEntry[];
  iframeKey: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  restart: (code: string) => void;
} {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const runId = useRef(1);
  const applied = useRef(code);
  const ready = useRef(false);
  const holding = useRef(held);
  const runStarted = useRef(onRun);
  runStarted.current = onRun;

  // Runs `next` in a fresh iframe now. A later change of `code` to `next` does not run it again.
  const restart = (next: string) => {
    applied.current = next;
    holding.current = false;
    runId.current += 1;
    setEntries([]);
    setIframeKey(key => key + 1);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: restart only touches refs and state setters
  useEffect(() => {
    if (code === applied.current) return;
    const timer = setTimeout(() => restart(code), delayMs);
    return () => clearTimeout(timer);
  }, [code, delayMs]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: each iframe mount starts its own wait
  useEffect(() => {
    ready.current = false;
    const timer = setTimeout(() => {
      if (!ready.current)
        setEntries(previous => [...previous, { level: "system", text: "The preview did not start." }]);
    }, READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [iframeKey]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const target = iframeRef.current?.contentWindow;
      if (!target || event.source !== target || !isRunnerMessage(event.data)) return;
      const message = event.data;
      if (message.type === "ready") {
        ready.current = true;
        if (holding.current) return;
        runStarted.current?.();
        const run: ParentMessage = { type: "run", runId: runId.current, code: applied.current };
        target.postMessage(run, "*");
      } else if (message.runId === runId.current) {
        setEntries(previous => [...previous, { level: message.level, text: message.text }].slice(-MAX_ENTRIES));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return { entries, iframeKey, iframeRef, restart };
}
