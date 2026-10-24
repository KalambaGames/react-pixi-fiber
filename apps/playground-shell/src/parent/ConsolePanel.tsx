import { useLayoutEffect, useRef } from "react";
import { cn } from "./lib/utils";
import type { ConsoleEntry } from "./useRunner";

const levelClass: Partial<Record<ConsoleEntry["level"], string>> = {
  error: "text-destructive",
  system: "text-muted-foreground italic",
  warn: "text-warning",
};

export function ConsolePanel({ entries }: { entries: ConsoleEntry[] }) {
  const panel = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: new entries are the trigger
  useLayoutEffect(() => {
    if (atBottom.current && panel.current) panel.current.scrollTop = panel.current.scrollHeight;
  }, [entries]);
  return (
    <div
      ref={panel}
      className="h-full overflow-auto bg-muted/30 font-mono text-xs"
      role="log"
      onScroll={event => {
        const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
        atBottom.current = scrollHeight - scrollTop - clientHeight < 4;
      }}
    >
      {entries.map((entry, index) => (
        <div
          key={index}
          className={cn("whitespace-pre-wrap border-b px-2 py-0.5", levelClass[entry.level])}
          data-level={entry.level}
        >
          {entry.text}
        </div>
      ))}
    </div>
  );
}
