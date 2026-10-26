import {
  Atom,
  Blocks,
  ChevronRight,
  CircleFadingArrowUp,
  type LucideIcon,
  Package,
  Puzzle,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { buildHash } from "../share";
import { versionHref, versions } from "../versions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./components/ui/hover-card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "./components/ui/sidebar";
import { EditedDot } from "./EditedDot";
import logo from "./logo.svg";
import type { Example, ExampleGroup } from "./Playground";

const groups: { icon: LucideIcon; name: ExampleGroup }[] = [
  // PixiJS 8 calls its renderable classes Scene Objects. PixiJS 4 to 7 call them Display Objects.
  { icon: Blocks, name: "Scene Objects" },
  { icon: Blocks, name: "Display Objects" },
  { icon: Atom, name: "Features" },
  { icon: Puzzle, name: "Integrations" },
  { icon: CircleFadingArrowUp, name: "Migration" },
];

// A long title wraps inside its row. The current example stands out from the hover background of the other links.
const linkClass =
  "h-auto min-h-7 py-1 data-[active=true]:bg-sidebar-primary data-[active=true]:font-medium data-[active=true]:text-sidebar-primary-foreground data-[active=true]:hover:bg-sidebar-primary data-[active=true]:hover:text-sidebar-primary-foreground";

// Collapsed to icons, a section is one icon that lists its links on hover.
function HoverSection({
  icon: Icon,
  links,
  name,
}: {
  icon: LucideIcon;
  links: { active: boolean; edited?: boolean; href: string; label: string }[];
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
                <SidebarMenuSubButton asChild className={linkClass} isActive={link.active}>
                  <a href={link.href}>
                    {link.label}
                    {link.edited && <EditedDot label="Edited" />}
                  </a>
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
  edited,
  examples,
  pixiMajor,
  selectedId,
}: {
  edited: Set<string>;
  examples: Example[];
  pixiMajor: number;
  selectedId: string;
}) {
  const { isMobile, setOpenMobile, state } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const sections = groups
    .map(group => ({ ...group, items: examples.filter(example => example.group === group.name) }))
    .filter(section => section.items.length > 0);
  const links = versions.map(version => ({
    href: versionHref(version, window.location, selectedId),
    label: version.label,
  }));
  const current = links.find(link => link.label === `PixiJS ${pixiMajor}`) ?? links[0];
  const [filter, setFilter] = useState("");
  // Only the group of the current example starts open. A click on a group label opens or closes it.
  const [openGroups, setOpenGroups] = useState<Partial<Record<ExampleGroup, boolean>>>({});
  const currentGroup = examples.find(example => example.id === selectedId)?.group;
  const needle = filter.trim().toLowerCase();
  const filtered = sections
    .map(section => ({ ...section, items: section.items.filter(item => item.title.toLowerCase().includes(needle)) }))
    .filter(section => section.items.length > 0);
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
              {links.map(link => (
                <SelectItem key={link.href} value={link.href}>
                  {link.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <SidebarInput
          aria-label="Filter examples"
          className="group-data-[collapsible=icon]:hidden"
          onChange={event => setFilter(event.target.value)}
          placeholder="Filter examples"
          type="search"
          value={filter}
        />
      </SidebarHeader>
      <SidebarContent>
        {collapsed ? (
          <SidebarGroup className="px-0">
            <SidebarMenu>
              <HoverSection
                icon={Package}
                links={links.map(link => ({ ...link, active: link === current }))}
                name="PixiJS version"
              />
              {sections.map(({ icon, items, name }) => (
                <HoverSection
                  key={name}
                  icon={icon}
                  links={items.map(example => ({
                    active: example.id === selectedId,
                    edited: edited.has(example.id),
                    href: buildHash(example.id),
                    label: example.title,
                  }))}
                  name={name}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <SidebarGroup className="px-0">
            <SidebarMenu>
              {filtered.map(({ icon: Icon, items, name }) => (
                <Collapsible
                  key={name}
                  asChild
                  className="group/collapsible"
                  onOpenChange={open => {
                    if (needle === "") setOpenGroups(groups => ({ ...groups, [name]: open }));
                  }}
                  // While the filter has text, every group with a match is open, and a click on its label changes nothing.
                  open={needle !== "" || (openGroups[name] ?? name === currentGroup)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="cursor-pointer">
                        <Icon />
                        <span>{name}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {items.map(example => (
                          <SidebarMenuSubItem key={example.id}>
                            <SidebarMenuSubButton asChild className={linkClass} isActive={example.id === selectedId}>
                              <a href={buildHash(example.id)} onClick={() => setOpenMobile(false)}>
                                {example.title}
                                {edited.has(example.id) && <EditedDot label="Edited" />}
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
            {filtered.length === 0 && <p className="px-2 text-muted-foreground text-sm">No examples match</p>}
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
