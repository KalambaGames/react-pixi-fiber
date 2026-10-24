import type { RefObject } from "react";

export function Preview({
  iframeKey,
  iframeRef,
  src,
}: {
  iframeKey: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  src: string;
}) {
  // The runner page has no colour scheme. A matching scheme keeps the frame transparent in the dark theme.
  // While a panel separator is dragged, the frame ignores the pointer so the drag does not stop over it.
  return (
    <iframe
      key={iframeKey}
      className="block size-full border-0 scheme-light [body:has([data-separator=active])_&]:pointer-events-none"
      ref={iframeRef}
      sandbox="allow-scripts"
      src={src}
      title="Example preview"
    />
  );
}
