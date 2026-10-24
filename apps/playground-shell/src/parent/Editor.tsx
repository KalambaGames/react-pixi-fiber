import { javascript } from "@codemirror/lang-javascript";
import { Compartment } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup, EditorView } from "codemirror";
import { useEffect, useRef, useState } from "react";

// The fold gutter draws text arrows that sit below the line's center. A chevron mask centers them.
const chevron = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>"
)}") center / 14px no-repeat`;

export function Editor({ dark, onChange, value }: { dark: boolean; onChange: (code: string) => void; value: string }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const syncing = useRef(false);
  const latest = useRef(onChange);
  const [theme] = useState(() => new Compartment());

  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: created once; later values are applied by the effect below
  useEffect(() => {
    const editor = new EditorView({
      parent: host.current ?? undefined,
      doc: value,
      extensions: [
        basicSetup,
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-foldGutter span": {
            backgroundColor: "currentColor",
            display: "block",
            fontSize: "0",
            height: "100%",
            mask: chevron,
            width: "14px",
          },
          '.cm-foldGutter span[title="Unfold line"]': { transform: "rotate(-90deg)" },
        }),
        javascript({ jsx: true, typescript: true }),
        theme.of(dark ? oneDark : []),
        EditorView.updateListener.of(update => {
          if (update.docChanged && !syncing.current) latest.current(update.state.doc.toString());
        }),
      ],
    });
    view.current = editor;
    return () => editor.destroy();
  }, []);

  useEffect(() => {
    view.current?.dispatch({ effects: theme.reconfigure(dark ? oneDark : []) });
  }, [dark, theme]);

  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.state.doc.toString() === value) return;
    syncing.current = true;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    syncing.current = false;
  }, [value]);

  return <div className="h-full min-h-0 overflow-hidden" ref={host} />;
}
