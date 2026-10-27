// `resizeTo` is a PixiJS application option and works in `options`.
// A React ref cannot go there: `Stage` reads `options` at mount, while `ref.current` is still `null`.
// So this example sets `app.resizeTo` in `onInit`.
// PixiJS measures the `resizeTo` element on a window resize only, so the left stage ignores the dragged corner.
// The right stage also calls `app.resize()` from a `ResizeObserver`, so it follows any change to its element.
import { type RefObject, useEffect, useRef, useState } from "react";
import { Stage, Text, usePixiApp } from "react-pixi-fiber";

function Size({ label, observe }: { label: string; observe?: RefObject<HTMLDivElement | null> }) {
  const app = usePixiApp();
  const [size, setSize] = useState(() => `${app.screen.width} × ${app.screen.height}`);

  useEffect(() => {
    const update = () => setSize(`${app.screen.width} × ${app.screen.height}`);
    app.renderer.on("resize", update);
    return () => {
      app.renderer.off("resize", update);
    };
  }, [app]);

  // `onInit` sets `app.resizeTo` after this effect runs, so the element comes from the ref.
  useEffect(() => {
    const element = observe?.current;
    if (!element) return;
    const observer = new ResizeObserver(() => app.resize());
    observer.observe(element);
    return () => observer.disconnect();
  }, [app, observe]);

  return (
    <>
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 14 }} text={label} x={10} y={10} />
      <Text style={{ fill: "white", fontFamily: "Arial", fontSize: 24 }} text={size} x={10} y={35} />
      <Text
        style={{ fill: "white", fontFamily: "Arial", fontSize: 12 }}
        text="Drag the corner or resize the window"
        x={10}
        y={70}
      />
    </>
  );
}

function Panel({ label, observe = false }: { label: string; observe?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} style={{ flex: "1 1 0", minWidth: 0, overflow: "hidden" }}>
      <Stage
        onInit={app => {
          if (ref.current) app.resizeTo = ref.current;
        }}
        options={{ backgroundColor: 0x1099bb }}
        style={{ display: "block", outlineOffset: -1 }}
      >
        <Size label={label} observe={observe ? ref : undefined} />
      </Stage>
    </div>
  );
}

export default function ResizeExample() {
  return (
    <div
      style={{
        background: "rgb(16 153 187 / 50%)",
        boxSizing: "border-box",
        display: "flex",
        gap: 8,
        height: 300,
        overflow: "hidden",
        padding: 10,
        resize: "both",
        width: "100%",
      }}
    >
      <Panel label="resizeTo" />
      <Panel label="resizeTo + ResizeObserver" observe />
    </div>
  );
}
