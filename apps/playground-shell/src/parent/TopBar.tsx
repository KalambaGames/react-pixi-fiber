import { Code, Columns3, Eye, type LucideIcon, RotateCcw, Rows3, Share2, SunMoon } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";
import { EditedDot } from "./EditedDot";
import type { Example } from "./Playground";
import type { Layout } from "./useLayout";

const layouts: { icon: LucideIcon; label: string; value: Layout }[] = [
  { icon: Code, label: "Editor only", value: "editor" },
  { icon: Columns3, label: "Editor and preview", value: "both" },
  { icon: Rows3, label: "Preview, editor and console stacked", value: "stacked" },
  { icon: Eye, label: "Preview only", value: "preview" },
];

export function TopBar({
  dark,
  edited,
  example,
  layout,
  onLayout,
  onReset,
  onShare,
  onShareClose,
  onToggleTheme,
  shareUrl,
}: {
  dark: boolean;
  edited: boolean;
  example: Example;
  layout: Layout;
  onLayout: (layout: Layout) => void;
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
            {edited && (
              <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground text-xs">
                <EditedDot />
                Edited
              </span>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <ToggleGroup
        aria-label="Layout"
        size="sm"
        type="single"
        value={layout}
        variant="outline"
        onValueChange={value => value && onLayout(value as Layout)}
      >
        {layouts.map(({ icon: Icon, label, value }) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <ToggleGroupItem aria-label={label} value={value}>
                <Icon />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </ToggleGroup>
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
