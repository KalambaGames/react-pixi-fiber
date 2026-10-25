import { ChevronRight, Copy, Plug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";
import { Editor } from "./Editor";

// The configure code the example runs with, collapsed to one line below the editor. It opens upwards.
export function SetupBar({ code, dark, summary }: { code: string; dark: boolean; summary: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Setup copied");
    } catch {
      toast("Copy failed. Open the setup and select the code.");
    }
  };
  return (
    <Collapsible className="flex flex-col-reverse border-t">
      <CollapsibleTrigger asChild>
        <Button className="group h-8 shrink-0 justify-start rounded-none" size="sm" variant="ghost">
          <ChevronRight className="transition-transform group-data-[state=open]:-rotate-90" />
          <Plug />
          <span className="truncate">Setup: {summary}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="relative">
        <Editor dark={dark} readOnly value={code} />
        <Button
          aria-label="Copy setup"
          className="absolute top-1 right-1"
          size="icon-sm"
          variant="ghost"
          onClick={copy}
        >
          <Copy />
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
