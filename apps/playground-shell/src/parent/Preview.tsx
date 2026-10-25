import { type CSSProperties, type RefObject, useLayoutEffect, useRef, useState } from "react";

// A browser reloads an iframe that moves to a new parent, so the frame stays in one place and covers the slot
// of the current layout. A layout switch then keeps the example running.
export function Preview({
  iframeKey,
  iframeRef,
  slot,
  src,
}: {
  iframeKey: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  slot: HTMLElement | null;
  src: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    const host = frame.current?.offsetParent;
    if (!slot || !host) return setBox({ visibility: "hidden" });
    const measure = () => {
      const target = slot.getBoundingClientRect();
      const origin = host.getBoundingClientRect();
      // A hidden slot has no size, and the frame hides with it.
      setBox(
        target.width === 0
          ? { visibility: "hidden" }
          : {
              height: target.height,
              left: target.left - origin.left,
              top: target.top - origin.top,
              width: target.width,
            }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    observer.observe(host);
    return () => observer.disconnect();
  }, [slot]);

  // The runner page has no colour scheme. A matching scheme keeps the frame transparent in the dark theme.
  // While a panel separator is dragged, the frame ignores the pointer so the drag does not stop over it.
  return (
    <div ref={frame} className="absolute" style={box}>
      <iframe
        key={iframeKey}
        className="block size-full border-0 scheme-light [body:has([data-separator=active])_&]:pointer-events-none"
        ref={iframeRef}
        sandbox="allow-scripts"
        src={src}
        title="Example preview"
      />
    </div>
  );
}
