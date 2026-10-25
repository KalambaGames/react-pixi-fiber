import { ChevronRight, SquareChevronRight } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import type { ConsoleEntry } from "./useRunner";

const levelClass: Partial<Record<ConsoleEntry["level"], string>> = {
  error: "text-destructive",
  system: "text-muted-foreground italic",
  warn: "text-warning",
};

export function ConsolePanel({
  entries,
  onToggle,
  open,
}: {
  entries: ConsoleEntry[];
  onToggle: () => void;
  open: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: new entries and opening are the trigger
  useLayoutEffect(() => {
    if (atBottom.current && panel.current) panel.current.scrollTop = panel.current.scrollHeight;
  }, [entries, open]);
  return (
    <div className="flex h-full flex-col-reverse bg-muted/30">
      <Button
        aria-expanded={open}
        className="group h-8 shrink-0 justify-start rounded-none aria-expanded:border-t"
        size="sm"
        variant="ghost"
        onClick={onToggle}
      >
        <ChevronRight className="transition-transform group-aria-expanded:-rotate-90" />
        <SquareChevronRight />
        Console
        {entries.length > 0 && <span className="text-muted-foreground">{entries.length}</span>}
      </Button>
      <div
        ref={panel}
        className="min-h-0 flex-1 overflow-auto font-mono text-xs"
        hidden={!open}
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
    </div>
  );
}
