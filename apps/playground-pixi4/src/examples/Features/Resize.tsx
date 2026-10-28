// The left stage resizes on a window resize only, so it ignores the dragged corner.
// The right stage resizes from a `ResizeObserver`, so it follows any change to its element.
import { type RefObject, useEffect, useRef, useState } from "react";
import { Stage, Text, usePixiApp } from "react-pixi-fiber";

function Size({
  label,
  observe,
  target,
}: {
  label: string;
  observe: boolean;
  target: RefObject<HTMLDivElement | null>;
}) {
  const app = usePixiApp();
  const [size, setSize] = useState(() => `${app.screen.width} × ${app.screen.height}`);

  useEffect(() => {
    const element = target.current;
    if (!element) return;
    const resize = () => {
      app.renderer.resize(element.clientWidth, element.clientHeight);
      setSize(`${app.screen.width} × ${app.screen.height}`);
    };
    resize();
    if (observe) {
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [app, observe, target]);

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
      <Stage options={{ backgroundColor: 0x1099bb }} style={{ display: "block", outlineOffset: -1 }}>
        <Size label={label} observe={observe} target={ref} />
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
      <Panel label="window resize" />
      <Panel label="ResizeObserver" observe />
    </div>
  );
}
