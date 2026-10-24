import { Blocks, ChevronRight, CircleFadingArrowUp, type LucideIcon, Package, Sparkles } from "lucide-react";
import { buildHash } from "../share";
import { versions } from "../versions";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./components/ui/hover-card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "./components/ui/sidebar";
import logo from "./logo.svg";
import type { Example, ExampleGroup } from "./Playground";

const groups: { icon: LucideIcon; name: ExampleGroup }[] = [
  // PixiJS 8 calls its renderable classes Scene Objects. PixiJS 4 to 7 call them Display Objects.
  { icon: Blocks, name: "Scene Objects" },
  { icon: Blocks, name: "Display Objects" },
  { icon: Sparkles, name: "Features" },
  { icon: CircleFadingArrowUp, name: "Migration" },
];

// Collapsed to icons, a section is one icon that lists its links on hover.
function HoverSection({
  icon: Icon,
  links,
  name,
}: {
  icon: LucideIcon;
  links: { active: boolean; href: string; label: string }[];
  name: string;
}) {
  return (
    <SidebarMenuItem>
      <HoverCard closeDelay={50} openDelay={50}>
        <HoverCardTrigger asChild>
          <SidebarMenuButton aria-label={name} isActive={links.some(link => link.active)}>
            <Icon />
            <span>{name}</span>
            <ChevronRight className="ml-auto" />
          </SidebarMenuButton>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-auto min-w-44 p-0" side="right">
          <div className="flex items-center gap-2 border-b p-3 font-medium text-sm">
            <Icon className="size-4" />
            {name}
          </div>
          <SidebarMenuSub className="m-0 max-h-[70svh] overflow-y-auto border-0 p-1">
            {links.map(link => (
              <SidebarMenuSubItem key={link.href}>
                <SidebarMenuSubButton asChild isActive={link.active}>
                  <a href={link.href}>{link.label}</a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </HoverCardContent>
      </HoverCard>
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  examples,
  pixiMajor,
  selectedId,
}: {
  examples: Example[];
  pixiMajor: number;
  selectedId: string;
}) {
  const { isMobile, setOpenMobile, state } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const sections = groups
    .map(group => ({ ...group, items: examples.filter(example => example.group === group.name) }))
    .filter(section => section.items.length > 0);
  const current = versions.find(version => version.label === `PixiJS ${pixiMajor}`) ?? versions[0];
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="px-0">
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:p-0">
          <img alt="" className="size-8 shrink-0" src={logo} />
          <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">react-pixi-fiber</span>
        </div>
        <Select
          value={current.href}
          onValueChange={href => {
            window.location.href = href;
          }}
        >
          <SelectTrigger aria-label="PixiJS version" className="w-full group-data-[collapsible=icon]:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              {versions.map(version => (
                <SelectItem key={version.href} value={version.href}>
                  {version.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </SidebarHeader>
      <SidebarContent>
        {collapsed ? (
          <SidebarGroup className="px-0">
            <SidebarMenu>
              <HoverSection
                icon={Package}
                links={versions.map(version => ({
                  active: version === current,
                  href: version.href,
                  label: version.label,
                }))}
                name="PixiJS version"
              />
              {sections.map(({ icon, items, name }) => (
                <HoverSection
                  key={name}
                  icon={icon}
                  links={items.map(example => ({
                    active: example.id === selectedId,
                    href: buildHash(example.id),
                    label: example.title,
                  }))}
                  name={name}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          sections.map(({ icon: Icon, items, name }) => (
            <SidebarGroup key={name} className="px-0">
              <SidebarGroupLabel className="gap-2">
                <Icon />
                {name}
              </SidebarGroupLabel>
              <SidebarMenu>
                {items.map(example => (
                  <SidebarMenuItem key={example.id}>
                    <SidebarMenuButton asChild isActive={example.id === selectedId}>
                      <a href={buildHash(example.id)} onClick={() => setOpenMobile(false)}>
                        {example.title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>
    </Sidebar>
  );
}
