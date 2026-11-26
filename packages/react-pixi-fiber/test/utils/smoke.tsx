import React, { StrictMode } from "react";
import type { ReactTestRenderer } from "react-test-renderer";
import renderer, { act } from "react-test-renderer";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PixiAdapter, ReactAdapter } from "react-pixi-fiber";
import { Container, configure, PIXIComponent, Sprite, Stage } from "react-pixi-fiber";

const settle = () =>
  act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });

const create = (element: React.ReactElement) => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element, { createNodeMock: () => document.createElement("canvas") });
  });
  return tree;
};

// What each hook call of a commit sees, as `hook child:order of the children`. Each commit goes from one order to
// another, and mixes moves, adds and removes. React 17, 18 and 19 give this order of calls today: the removes, then
// each child that React places. The README says that the order is not specified, so a behavior must not depend on it.
// If a React release changes the order, change these values. The positions that the test checks must stay correct.
const MIXED_COMMITS: Record<string, string[]> = {
  "abc > cba": ["move b:acb", "move a:cba"],
  "abcd > xdyca": ["remove b:abcd", "add x:acxd", "add y:acxdy", "move c:axdyc", "move a:xdyca"],
  "abcde > ecxa": ["remove b:abcde", "remove d:acde", "move c:aec", "add x:aecx", "move a:ecxa"],
  "abcd > dxbya": ["remove c:abcd", "add x:abdx", "move b:adxb", "add y:adxby", "move a:dxbya"],
  "abcdef > fzaycx": [
    "remove b:abcdef",
    "remove d:acdef",
    "remove e:acef",
    "add z:acfz",
    "move a:cfza",
    "add y:cfzay",
    "move c:fzayc",
    "add x:fzaycx",
  ],
};

export function smokeSuite(name: string, pair: () => { react: ReactAdapter; pixi: PixiAdapter }) {
  describe(`smoke: ${name}`, () => {
    // react-test-renderer is a secondary renderer, like the PixiJS tree that Stage renders. React 17 and 18 keep the
    // last secondary renderer on each context, so they warn that two renderers render it. React DOM is a primary
    // renderer, so an app does not get this warning.
    let error: MockInstance<typeof console.error>;
    let previousActEnvironment: unknown;
    beforeEach(() => {
      // Every update here runs in act(). Without this flag React 18 and later warn on each act() call.
      previousActEnvironment = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
      (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
      const original = console.error;
      error = vi.spyOn(console, "error").mockImplementation((...args) => {
        if (!String(args[0]).includes("multiple renderers concurrently rendering the same context provider")) {
          original(...args);
        }
      });
    });
    afterEach(() => {
      error.mockRestore();
      (globalThis as any).IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    });

    it("mounts Stage, renders a Sprite, changes a prop, reorders children and unmounts", async () => {
      configure(pair());
      let app: any = null;
      const Scene = ({ order, x }: { order: string[]; x: number }) => (
        <Stage
          options={{ width: 8, height: 8 }}
          onInit={a => {
            app = a;
          }}
        >
          <Container>
            {order.map(key => (
              <Sprite key={key} x={key === "a" ? x : 0} />
            ))}
          </Container>
        </Stage>
      );
      const tree = create(<Scene order={["a", "b"]} x={1} />);
      await settle();
      expect(app).not.toBeNull();
      // Captured before unmount: destroying the application nulls app.stage.
      const stage = app.stage;
      const container = stage.children[0];
      expect(container.children).toHaveLength(2);
      expect(container.children[0].x).toBe(1);

      act(() => {
        tree.update(<Scene order={["a", "b"]} x={5} />);
      });
      expect(container.children[0].x).toBe(5);

      act(() => {
        tree.update(<Scene order={["b", "a"]} x={5} />);
      });
      expect(container.children[1].x).toBe(5);
      expect(container.children[0].x).toBe(0);

      act(() => {
        tree.unmount();
      });
      await settle();
      expect(stage.children).toHaveLength(0);
    });

    it("bridges a context provided around Stage and applies a value change", async () => {
      configure(pair());
      const X = React.createContext(0);
      const Bridged = () => <Sprite x={React.useContext(X)} />;
      let app: any = null;
      const Scene = ({ x }: { x: number }) => (
        <X.Provider value={x}>
          <Stage
            bridgeContexts={[X]}
            options={{ width: 8, height: 8 }}
            onInit={a => {
              app = a;
            }}
          >
            <Bridged />
          </Stage>
        </X.Provider>
      );
      const tree = create(<Scene x={1} />);
      await settle();
      const sprite = app.stage.children[0];
      expect(sprite.x).toBe(1);

      act(() => {
        tree.update(<Scene x={5} />);
      });
      expect(sprite.x).toBe(5);

      act(() => {
        tree.unmount();
      });
      await settle();
    });

    it("restores a removed prop to its default without a warning under StrictMode, and writes an explicit null", async () => {
      configure(pair());
      let app: any = null;
      const Scene = (props: { alpha?: null | number; visible?: boolean }) => (
        <Stage
          options={{ width: 8, height: 8 }}
          onInit={a => {
            app = a;
          }}
        >
          <StrictMode>
            <Sprite {...(props as { alpha?: number })} />
          </StrictMode>
        </Stage>
      );
      const tree = create(<Scene alpha={0.5} visible={false} />);
      await settle();
      const sprite = app.stage.children[0];
      expect([sprite.alpha, sprite.visible]).toEqual([0.5, false]);

      act(() => {
        tree.update(<Scene />);
      });
      expect([sprite.alpha, sprite.visible]).toEqual([1, true]);
      expect(error.mock.calls.filter(c => /Received .* for prop/.test(String(c[0])))).toHaveLength(0);

      act(() => {
        tree.update(<Scene alpha={null} />);
      });
      expect(sprite.alpha).toBeNull();

      act(() => {
        tree.unmount();
      });
      await settle();
    });

    it("calls afterAdd, afterMove and beforeRemove in commits that mix moves, adds and removes", async () => {
      const adapters = pair();
      configure(adapters);
      // The id stays off the Display Object: the property for it is `name` or `label`, by PixiJS major.
      const ids = new WeakMap<object, string>();
      const order = (parent: any) => parent.children.map((child: any) => ids.get(child)).join("");
      let calls: string[] = [];
      // Puts the children of the parent in a stack, as the `afterMove` example in the README does.
      const stack = (hook: string, row: any, removed?: any) => {
        calls.push(`${hook} ${ids.get(row)}:${order(row.parent)}`);
        let y = 0;
        for (const child of row.parent.children) {
          if (child === removed) continue;
          child.y = y;
          y += 40;
        }
      };
      const Row = PIXIComponent<any, { id: string }>("SmokeRow", {
        afterAdd: row => stack("add", row),
        afterMove: row => stack("move", row),
        applyProps: () => {},
        beforeRemove: row => stack("remove", row, row),
        create: ({ id }) => {
          const row = adapters.pixi.behaviors.Container.create({});
          ids.set(row, id);
          return row;
        },
      });
      let app: any = null;
      const Scene = ({ rows }: { rows: string }) => (
        <Stage
          options={{ width: 8, height: 8 }}
          onInit={a => {
            app = a;
          }}
        >
          <Container>
            {[...rows].map(id => (
              <Row key={id} id={id} />
            ))}
          </Container>
        </Stage>
      );
      const tree = create(<Scene rows="" />);
      await settle();
      const container = app.stage.children[0];
      const recorded: Record<string, string[]> = {};

      for (const commit of Object.keys(MIXED_COMMITS)) {
        const [from, to] = commit.split(" > ");
        act(() => {
          tree.update(<Scene rows={from} />);
        });
        calls = [];
        act(() => {
          tree.update(<Scene rows={to} />);
        });
        recorded[commit] = calls;
        calls = [];
        expect(container.children.map((row: any) => `${ids.get(row)}:${row.y}`)).toEqual(
          [...to].map((id, index) => `${id}:${index * 40}`)
        );
        act(() => {
          tree.update(<Scene rows="" />);
        });
      }
      expect(recorded).toEqual(MIXED_COMMITS);

      act(() => {
        tree.unmount();
      });
      await settle();
    });
  });
}
