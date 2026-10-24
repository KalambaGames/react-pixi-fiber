import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { toast } from "sonner";
import { buildHash, decodeCode, encodeCode, parseHash } from "../share";
import { browserStorage, createStore, type CodeStore } from "../storage";
import { AppSidebar } from "./AppSidebar";
import { Banner } from "./Banner";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
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

export type ExampleGroup = "Display Objects" | "Features" | "Migration" | "Scene Objects";

export interface Example {
  code: string;
  configure: { code: string; summary: string };
  group: ExampleGroup;
  id: string;
  runner: string;
  title: string;
}

interface Resolved {
  banner: "shared" | null;
  code: string;
  example: Example;
  held: boolean;
  notices: string[];
  staleHash: string | null;
}

const HELD =
  "The last run of this code did not finish. Edit the code to run it again, or press Reset to load the original example.";

export async function resolve(examples: Example[], store: CodeStore, hash: string): Promise<Resolved> {
  const parsed = parseHash(hash);
  const known = examples.find(candidate => candidate.id === parsed.exampleId);
  const example = known ?? examples[0];
  const shared = known ? parsed.code : null;
  if (!known) window.history.replaceState(null, "", buildHash(example.id));
  if (shared !== null) {
    try {
      const code = await decodeCode(shared);
      const held = store.wasRunning(example.id);
      return { banner: "shared", code, example, held, notices: held ? [HELD] : [], staleHash: null };
    } catch {
      window.history.replaceState(null, "", buildHash(example.id));
    }
  }
  const saved = store.load(example.id, example.code);
  const held = saved !== null && store.wasRunning(example.id);
  const notices = [...(shared === null ? [] : ["This link holds code that cannot be read."]), ...(held ? [HELD] : [])];
  return {
    banner: null,
    code: saved?.code ?? example.code,
    example,
    held,
    notices,
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

function Panels({
  console,
  editor,
  isMobile,
  layout,
  preview,
}: {
  console: ReactNode;
  editor: ReactNode;
  isMobile: boolean;
  layout: Layout;
  preview: ReactNode;
}) {
  const main = useDefaultLayout({ id: "playground:panels:main", storage: panelStorage });
  const output = useDefaultLayout({ id: "playground:panels:output", storage: panelStorage });
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
        <div className="h-48 border-t" data-hidden={outputHidden}>
          {console}
        </div>
      </div>
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
          defaultLayout={output.defaultLayout}
          orientation="vertical"
          onLayoutChanged={output.onLayoutChanged}
        >
          <ResizablePanel defaultSize="70" id="preview">
            {preview}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="30" id="console" minSize="10">
            {console}
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function Session({
  dark,
  onTheme,
  resolved,
  store,
}: {
  dark: boolean;
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
  const { entries, iframeKey, iframeRef, restart } = useRunner(example.runner, code, {
    held: resolved.held,
    onRun: () => {
      store.markRunning(example.id);
      setTimeout(() => store.clearRunning(example.id), 2000);
    },
  });
  // Switching between the mobile and desktop layouts mounts a new editor and preview, so the example runs again.
  const isMobile = useIsMobile();
  const mobileLayout = useRef(isMobile);
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a layout switch restarts, with the code shown then
  useEffect(() => {
    if (mobileLayout.current === isMobile) return;
    mobileLayout.current = isMobile;
    restart(code);
  }, [isMobile]);
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = () => {
    clearTimeout(timer.current);
    if (pending.current !== null) store.save(example.id, pending.current, example.code, staleHash.current ?? undefined);
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
    setCode(example.code);
    restart(example.code);
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
    <>
      <TopBar
        dark={dark}
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
        console={<ConsolePanel entries={shown} />}
        isMobile={isMobile}
        layout={layout}
        editor={
          <>
            <div className="flex flex-col gap-2 empty:hidden [&:has(>*)]:p-2">
              {banner === "shared" && <Banner text="Shared code. Editing saves it as your version." />}
              {upstream && (
                <Banner
                  text="This example changed since you edited it."
                  actions={[{ label: "Reset", onClick: reset }]}
                />
              )}
            </div>
            <SetupBar code={example.configure.code} summary={example.configure.summary} />
            <div className="min-h-0 flex-1">
              <Editor dark={dark} value={code} onChange={edit} />
            </div>
          </>
        }
        preview={<Preview iframeKey={iframeKey} iframeRef={iframeRef} src={example.runner} />}
      />
    </>
  );
}

export function Playground({ examples, pixiMajor }: { examples: Example[]; pixiMajor: number }) {
  const [store] = useState(() => createStore(pixiMajor));
  const { dark, setTheme, theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen();
  const [resolved, setResolved] = useState<{ id: number; value: Resolved } | null>(null);

  useEffect(() => {
    let latest = 0;
    const load = () => {
      const call = ++latest;
      resolve(examples, store, window.location.hash).then(value => {
        if (call === latest) setResolved(previous => ({ id: (previous?.id ?? 0) + 1, value }));
      });
    };
    load();
    window.addEventListener("hashchange", load);
    return () => {
      latest = -1;
      window.removeEventListener("hashchange", load);
    };
  }, [examples, store]);

  if (!resolved) return null;
  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar examples={examples} pixiMajor={pixiMajor} selectedId={resolved.value.example.id} />
      <SidebarInset className="h-[calc(100svh-1rem)] overflow-hidden max-md:h-auto max-md:overflow-visible">
        <Session key={resolved.id} dark={dark} resolved={resolved.value} store={store} onTheme={setTheme} />
      </SidebarInset>
      <Toaster theme={theme} />
    </SidebarProvider>
  );
}
