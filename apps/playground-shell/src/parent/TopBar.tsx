import { RotateCcw, Share2, SunMoon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "./components/ui/popover";
import { Separator } from "./components/ui/separator";
import { SidebarTrigger } from "./components/ui/sidebar";
import type { Example } from "./Playground";

export function TopBar({
  dark,
  example,
  onReset,
  onShare,
  onShareClose,
  onToggleTheme,
  shareUrl,
}: {
  dark: boolean;
  example: Example;
  onReset: () => void;
  onShare: () => void;
  onShareClose: () => void;
  onToggleTheme: () => void;
  shareUrl: string | null;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <SidebarTrigger />
      <Separator className="data-[orientation=vertical]:h-4" orientation="vertical" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>{example.group}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate">{example.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Button
        aria-label={dark ? "Switch to the light theme" : "Switch to the dark theme"}
        size="icon-sm"
        variant="ghost"
        onClick={onToggleTheme}
      >
        <SunMoon />
      </Button>
      <Button size="sm" variant="outline" onClick={onReset}>
        <RotateCcw />
        Reset
      </Button>
      <Popover open={shareUrl !== null} onOpenChange={open => !open && onShareClose()}>
        <PopoverAnchor asChild>
          <Button size="sm" variant="outline" onClick={onShare}>
            <Share2 />
            Share
          </Button>
        </PopoverAnchor>
        <PopoverContent align="end" className="flex w-96 flex-col gap-2">
          <p className="text-muted-foreground text-sm">Copy this link to share the code:</p>
          <Input
            aria-label="Share link"
            autoFocus
            readOnly
            value={shareUrl ?? ""}
            onFocus={event => event.currentTarget.select()}
          />
        </PopoverContent>
      </Popover>
    </header>
  );
}
