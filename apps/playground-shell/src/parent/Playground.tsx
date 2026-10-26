import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { type GroupProps, type Layout as PanelLayout, useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { toast } from "sonner";
import { buildHash, decodeCode, encodeCode, parseHash } from "../share";
import { browserStorage, createStore, type CodeStore } from "../storage";
import { AppSidebar } from "./AppSidebar";
import { Banner } from "./Banner";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { Skeleton } from "./components/ui/skeleton";
import { Toaster } from "./components/ui/sonner";
import { ConsolePanel } from "./ConsolePanel";
import { Editor } from "./Editor";
import { useIsMobile } from "./hooks/use-mobile";
import type { Layout } from "./useLayout";
import { Preview } from "./Preview";
import { SetupBar } from "./SetupBar";
import { TopBar } from "./TopBar";
import { useLayout } from "./useLayout";
import { useRunner } from "./useRunner";
import { useSidebarOpen } from "./useSidebarOpen";
import { useTheme, type Theme } from "./useTheme";

export type ExampleGroup = "Display Objects" | "Features" | "Filters" | "Integrations" | "Migration" | "Scene Objects";

export interface Example {
  /** Ids the example answered to before, for links and saved edits from then. */
  aliases?: string[];
  configure: { code: string; summary: string };
  group: ExampleGroup;
  id: string;
  load: () => Promise<string>;
  runner: string;
  title: string;
}

interface Resolved {
  banner: "shared" | null;
  code: string;
  example: Example;
  held: boolean;
  notices: string[];
  original: string;
  staleHash: string | null;
}

export async function resolve(examples: Example[], store: CodeStore, hash: string): Promise<Resolved> {
  const parsed = parseHash(hash);
  const id = parsed.exampleId ?? "";
  const known =
    examples.find(candidate => candidate.id === id) ?? examples.find(candidate => candidate.aliases?.includes(id));
  const example = known ?? examples[0];
  const shared = known ? parsed.code : null;
  // An alias becomes the current id in the address, an unknown id the first example.
  if (example.id !== id) window.history.replaceState(null, "", buildHash(example.id, shared ?? undefined));
  const original = await example.load();
  if (shared !== null) {
    try {
      const code = await decodeCode(shared);
      const held = store.wasRunning(example.id);
      return { banner: "shared", code, example, held, notices: [], original, staleHash: null };
    } catch {
      window.history.replaceState(null, "", buildHash(example.id));
    }
  }
  const saved = store.load(example.id, original);
  const held = saved !== null && store.wasRunning(example.id);
  const notices = shared === null ? [] : ["This link holds code that cannot be read."];
  return {
    banner: null,
    code: saved?.code ?? original,
    example,
    held,
    notices,
    original,
    staleHash: saved?.changedUpstream ? saved.originalHash : null,
  };
}

// Blocked storage or a corrupt saved value gives the default panel sizes.
const panelStorage = {
  getItem(key: string) {
    const value = browserStorage.get(key);
    try {
      if (value !== null) JSON.parse(value);
      return value;
    } catch {
      return null;
    }
  },
  setItem: browserStorage.set,
};

// A group that has no size yet gives the collapsed console all of it, and that layout cannot scale.
export function withConsoleSize(layout: PanelLayout, size: number): PanelLayout | undefined {
  if (layout.console >= 100) return undefined;
  const scale = (100 - size) / (100 - layout.console);
  return Object.fromEntries(Object.entries(layout).map(([id, value]) => [id, id === "console" ? size : value * scale]));
}

// The groups that hold the console get these sizes in their first render, also when no layout is saved. Without them,
// the console collapses on mount before the group has a size, and the collapsed console takes the whole group.
const OUTPUT_SIZES = { console: 30, preview: 70 };
const STACKED_SIZES = { console: 15, editor: 35, preview: 50 };

// The height of the console header, which stays visible while the console is collapsed.
const CONSOLE_COLLAPSED = "32px";

function Panels({
  console,
  editor,
  hasEntries,
  isMobile,
  layout,
  preview,
}: {
  console: (props: { onToggle: () => void; open: boolean }) => ReactNode;
  editor: ReactNode;
  hasEntries: boolean;
  isMobile: boolean;
  layout: Layout;
  preview: ReactNode;
}) {
  const main = useDefaultLayout({ id: "playground:panels:main", storage: panelStorage });
  const output = useDefaultLayout({ id: "playground:panels:output", storage: panelStorage });
  const stacked = useDefaultLayout({ id: "playground:panels:stacked", storage: panelStorage });
  // The console starts collapsed and opens when the example writes to it.
  const consolePanel = usePanelRef();
  const [consoleOpen, setConsoleOpen] = useState(false);
  const openConsole = (open: boolean) => {
    setConsoleOpen(open);
    if (open) consolePanel.current?.expand();
    else consolePanel.current?.collapse();
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: the first entry of a run is the trigger
  useEffect(() => {
    openConsole(hasEntries);
  }, [hasEntries]);
  // A collapsed console saves the size it had while open, so a reload opens it at that size.
  const consoleSize = useRef<number | undefined>(undefined);
  const keepConsoleSize =
    (
      { defaultLayout, onLayoutChanged }: ReturnType<typeof useDefaultLayout>,
      sizes: PanelLayout
    ): GroupProps["onLayoutChanged"] =>
    (layout, meta) => {
      const requested = meta.requestedLayout ?? layout;
      if (!consolePanel.current?.isCollapsed()) {
        consoleSize.current = requested.console;
        return onLayoutChanged(layout, meta);
      }
      const scaled = withConsoleSize(requested, consoleSize.current ?? defaultLayout?.console ?? sizes.console);
      if (scaled) onLayoutChanged(scaled, { ...meta, requestedLayout: undefined });
    };
  const consoleNode = console({ onToggle: () => openConsole(!consoleOpen), open: consoleOpen });
  const consoleResizable = (
    <ResizablePanel
      collapsedSize={CONSOLE_COLLAPSED}
      collapsible
      id="console"
      minSize="10"
      panelRef={consolePanel}
      onResize={() => {
        const open = !consolePanel.current?.isCollapsed();
        if (open !== consoleOpen) setConsoleOpen(open);
      }}
    >
      {consoleNode}
    </ResizablePanel>
  );
  // A hidden part stays mounted, so the example keeps running and the editor keeps its history.
  const editorHidden = layout === "preview" || undefined;
  const outputHidden = layout === "editor" || undefined;
  if (isMobile)
    return (
      <div className="flex flex-col [&>[data-hidden]]:hidden">
        <div className="flex h-[50vh] flex-col" data-hidden={editorHidden}>
          {editor}
        </div>
        <div className="h-[360px] border-t first:border-t-0" data-hidden={outputHidden}>
          {preview}
        </div>
        <div className={consoleOpen ? "h-48 border-t" : "border-t"} data-hidden={outputHidden}>
          {consoleNode}
        </div>
      </div>
    );
  if (layout === "stacked")
    return (
      <ResizablePanelGroup
        className="min-h-0 flex-1"
        defaultLayout={stacked.defaultLayout ?? STACKED_SIZES}
        orientation="vertical"
        onLayoutChanged={keepConsoleSize(stacked, STACKED_SIZES)}
      >
        <ResizablePanel id="preview" minSize="15">
          {preview}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="flex flex-col" id="editor" minSize="15">
          {editor}
        </ResizablePanel>
        <ResizableHandle withHandle />
        {consoleResizable}
      </ResizablePanelGroup>
    );
  return (
    <ResizablePanelGroup
      className="min-h-0 flex-1 [&>[data-hidden]]:hidden!"
      defaultLayout={main.defaultLayout}
      orientation="horizontal"
      onLayoutChanged={main.onLayoutChanged}
    >
      <ResizablePanel className="flex flex-col" data-hidden={editorHidden} defaultSize="50" id="editor" minSize="25">
        {editor}
      </ResizablePanel>
      <ResizableHandle data-hidden={editorHidden ?? outputHidden} withHandle />
      <ResizablePanel data-hidden={outputHidden} defaultSize="50" id="output" minSize="25">
        <ResizablePanelGroup
          defaultLayout={output.defaultLayout ?? OUTPUT_SIZES}
          orientation="vertical"
          onLayoutChanged={keepConsoleSize(output, OUTPUT_SIZES)}
        >
          <ResizablePanel id="preview">{preview}</ResizablePanel>
          <ResizableHandle withHandle />
          {consoleResizable}
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function Session({
  dark,
  edited,
  onTheme,
  resolved,
  store,
}: {
  dark: boolean;
  edited: boolean;
  onTheme: (theme: Theme) => void;
  resolved: Resolved;
  store: CodeStore;
}) {
  const { example } = resolved;
  const [code, setCode] = useState(resolved.code);
  const [banner, setBanner] = useState(resolved.banner);
  const [upstream, setUpstream] = useState(resolved.staleHash !== null);
  const staleHash = useRef(resolved.staleHash);
  const setStale = (hash: string | null) => {
    staleHash.current = hash;
    setUpstream(hash !== null);
  };
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [layout, setLayout] = useLayout();
  const { entries, iframeKey, iframeRef, loading, restart } = useRunner(example.runner, code, {
    held: resolved.held,
    onRun: () => {
      store.markRunning(example.id);
      setTimeout(() => store.clearRunning(example.id), 2000);
    },
  });
  // The mobile, split and stacked layouts each mount new panels. The preview frame and the editor stay outside them,
  // so a layout switch keeps the example running and the editor keeps its history.
  const isMobile = useIsMobile();
  const arrangement = isMobile ? "mobile" : layout === "stacked" ? "stacked" : "split";
  const [previewSlot, setPreviewSlot] = useState<HTMLDivElement | null>(null);
  const [editorHost] = useState(() =>
    Object.assign(document.createElement("div"), { className: "flex min-h-0 flex-1 flex-col" })
  );
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = () => {
    clearTimeout(timer.current);
    if (pending.current !== null)
      store.save(example.id, pending.current, resolved.original, staleHash.current ?? undefined);
    pending.current = null;
  };
  const drop = () => {
    clearTimeout(timer.current);
    pending.current = null;
  };
  // React does not unmount on a page unload, so the last edit is also saved when the page hides.
  // A page that hides did not hang, so its run is no longer marked as running.
  // biome-ignore lint/correctness/useExhaustiveDependencies: flush only reads refs and per-session constants
  useEffect(() => {
    const hide = () => {
      flush();
      store.clearRunning(example.id);
    };
    window.addEventListener("pagehide", hide);
    return () => {
      window.removeEventListener("pagehide", hide);
      flush();
    };
  }, []);

  const leaveShared = () => {
    if (banner !== "shared") return;
    window.history.replaceState(null, "", buildHash(example.id));
    setBanner(null);
  };
  const edit = (next: string) => {
    setCode(next);
    setShareUrl(null);
    if (banner === "shared") setStale(null);
    leaveShared();
    pending.current = next;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  };
  const reset = () => {
    drop();
    store.reset(example.id);
    setCode(resolved.original);
    restart(resolved.original);
    setStale(null);
    leaveShared();
  };
  const share = async () => {
    let encoded: string;
    try {
      encoded = await encodeCode(code);
    } catch {
      toast("This browser cannot create a share link.");
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}${buildHash(example.id, encoded)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareUrl(null);
      toast("Link copied");
    } catch {
      setShareUrl(url);
    }
  };

  const shown = [
    ...(iframeKey === 0 ? resolved.notices.map(text => ({ level: "system" as const, text })) : []),
    ...entries,
  ];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <TopBar
        dark={dark}
        edited={edited}
        example={example}
        layout={layout}
        shareUrl={shareUrl}
        onLayout={setLayout}
        onReset={reset}
        onShare={share}
        onShareClose={() => setShareUrl(null)}
        onToggleTheme={() => onTheme(dark ? "light" : "dark")}
      />
      <Panels
        key={arrangement}
        console={props => <ConsolePanel entries={shown} {...props} />}
        hasEntries={shown.length > 0}
        isMobile={isMobile}
        layout={layout}
        editor={
          <div
            className="contents"
            ref={slot => {
              if (slot && editorHost.parentNode !== slot) slot.append(editorHost);
            }}
          />
        }
        preview={<div className="size-full" ref={setPreviewSlot} />}
      />
      {createPortal(
        <>
          <div className="flex flex-col gap-2 empty:hidden [&:has(>*)]:p-2">
            {banner === "shared" && <Banner text="Shared code. Editing saves it as your version." />}
            {resolved.held && iframeKey === 0 && (
              <Banner
                text="The last run of this code did not finish. Press Run to try again."
                actions={[
                  { label: "Run", onClick: () => restart(code) },
                  { label: "Reset", onClick: reset },
                ]}
              />
            )}
            {upstream && (
              <Banner text="This example changed since you edited it." actions={[{ label: "Reset", onClick: reset }]} />
            )}
          </div>
          <div className="min-h-0 flex-1">
            <Editor dark={dark} value={code} onChange={edit} />
          </div>
          <SetupBar code={example.configure.code} dark={dark} summary={example.configure.summary} />
        </>,
        editorHost
      )}
      <Preview iframeKey={iframeKey} iframeRef={iframeRef} loading={loading} slot={previewSlot} src={example.runner} />
    </div>
  );
}

// Stands in for the session while the first example source loads.
function SessionSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
      <Skeleton className="h-8" />
      <div className="flex min-h-0 flex-1 gap-2 max-md:flex-col">
        <Skeleton className="flex-1" />
        <Skeleton className="flex-1" />
      </div>
    </div>
  );
}

export function Playground({ examples, pixiMajor }: { examples: Example[]; pixiMajor: number }) {
  const [store] = useState(() => createStore(pixiMajor));
  const { dark, setTheme, theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen();
  const [resolved, setResolved] = useState<{ id: number; value: Resolved } | null>(null);
  const [failed, setFailed] = useState(false);
  // The examples with a saved edit, one id per line, so the snapshot compares as a string.
  const editedIds = useSyncExternalStore(store.subscribe, () =>
    examples
      .filter(example => store.isEdited(example.id))
      .map(example => example.id)
      .join("\n")
  );
  const edited = new Set(editedIds.split("\n"));

  useEffect(() => {
    let latest = 0;
    const load = () => {
      const call = ++latest;
      resolve(examples, store, window.location.hash).then(
        value => {
          if (call !== latest) return;
          setFailed(false);
          setResolved(previous => ({ id: (previous?.id ?? 0) + 1, value }));
        },
        // An offline browser or a newer deploy without the old chunks cannot load the source.
        error => {
          if (call !== latest) return;
          console.error(error);
          setFailed(true);
        }
      );
    };
    load();
    window.addEventListener("hashchange", load);
    return () => {
      latest = -1;
      window.removeEventListener("hashchange", load);
    };
  }, [examples, store]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar
        edited={edited}
        examples={examples}
        pixiMajor={pixiMajor}
        selectedId={resolved?.value.example.id ?? parseHash(window.location.hash).exampleId ?? ""}
      />
      <SidebarInset className="h-[calc(100svh-1rem)] overflow-hidden max-md:h-auto max-md:overflow-visible">
        {failed ? (
          <div className="p-2">
            <Banner
              text="This example could not load. Check the connection and reload the page."
              actions={[{ label: "Reload", onClick: () => window.location.reload() }]}
            />
          </div>
        ) : resolved ? (
          <Session
            key={resolved.id}
            dark={dark}
            edited={edited.has(resolved.value.example.id)}
            resolved={resolved.value}
            store={store}
            onTheme={setTheme}
          />
        ) : (
          <SessionSkeleton />
        )}
      </SidebarInset>
      <Toaster theme={theme} />
    </SidebarProvider>
  );
}
