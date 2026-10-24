import { ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";

// The configure code the example runs with, collapsed to one line.
export function SetupBar({ code, summary }: { code: string; summary: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Setup copied");
    } catch {
      toast("Copy failed. Open the setup and select the code.");
    }
  };
  return (
    <Collapsible className="border-b">
      <div className="flex items-center gap-1 px-1 py-0.5">
        <CollapsibleTrigger asChild>
          <Button className="group min-w-0 flex-1 justify-start" size="sm" variant="ghost">
            <ChevronRight className="transition-transform group-data-[state=open]:rotate-90" />
            <span className="truncate">Setup: {summary}</span>
          </Button>
        </CollapsibleTrigger>
        <Button aria-label="Copy setup" size="icon-sm" variant="ghost" onClick={copy}>
          <Copy />
        </Button>
      </div>
      <CollapsibleContent>
        <pre className="overflow-x-auto px-3 pb-2 font-mono text-muted-foreground text-xs">{code}</pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
