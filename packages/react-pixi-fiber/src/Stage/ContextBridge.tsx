import type { ReactNode } from "react";
import React from "react";

export type BridgedContext = React.Context<any>;

// React does not pass context between renderers (facebook/react#17275) and the PixiJS tree is its own root.
// The consumers render in the tree around `Stage`, the providers wrap the children rendered into the PixiJS tree,
// so a value is read where it is provided and provided again where it is consumed. A value change re-renders
// `Stage`, which renders the children again with the new value.
export function ContextBridge({
  children,
  contexts,
  render,
}: {
  children?: ReactNode;
  contexts: readonly BridgedContext[];
  render: (children: ReactNode) => ReactNode;
}) {
  const bridge = (index: number, values: unknown[]): ReactNode => {
    if (index === contexts.length) {
      return render(
        contexts.reduceRight<ReactNode>(
          (inner, Context, i) => (
            // Nested, not siblings; the key only satisfies the lint rule for JSX in a callback.
            <Context.Provider key={i} value={values[i]}>
              {inner}
            </Context.Provider>
          ),
          children
        )
      );
    }
    const Context = contexts[index];
    return <Context.Consumer>{value => bridge(index + 1, [...values, value])}</Context.Consumer>;
  };
  return <>{bridge(0, [])}</>;
}
