# 0020. Let Filters Be Child Elements Whose Lifecycle the Core Owns

**Status:** accepted
**Date:** 2026-10-26

## Context

A PixiJS filter changes how a display object renders. The object holds its filters in the `filters` property, as an array. The library writes this array from the `filters` prop, like any other prop. The app creates each filter, and the app must destroy it.

PixiJS never destroys a filter when it destroys the object that holds the filter. `destroy({ children: true })` destroys the children of the object, but not the filters. A filter that nobody destroys keeps its GPU resources until the page closes.

An app that uses the `filters` prop must create the filter in a component and destroy it on unmount. A hook such as `useMemo` with an effect can do this. But in development, StrictMode on React 19, and on a React 18 concurrent root, runs each mount effect two times: mount, unmount, mount. The cleanup destroys the first filter, and `useMemo` gives the same destroyed filter again. A hook that creates the filter in the effect avoids this, but the first render then has no filter. Each app writes this code again, and each copy can leak or break.

An app can also share one filter between objects to save resources. But PixiJS keeps one compiled program for each filter class. A second filter of the same class uses the same program. Sharing an instance saves only a small object.

## Decision Drivers

- A filter that the library creates must not leak when its object unmounts
- The API must be the same for each PixiJS major
- React must control when a filter starts and stops, like it does for a display object
- The library must not keep two different mechanisms for the same lifecycle
- An app on PixiJS 8 must import only the filter classes that it renders

## Decision

A filter is a child element of the display object that it changes. The parent element owns `parent.filters`. The core writes the filter children into this array in JSX order, and writes `null` when the last filter child unmounts. The filter props set the filter parameters. JSX order sets the filter order, and a condition in JSX adds or removes a filter.

```jsx
<Sprite texture={texture}>
  <NoiseFilter noise={0.5} />
  {glow && <AlphaFilter alpha={0.5} />}
</Sprite>
```

The core destroys a filter that it created:

- When the filter element unmounts, the core removes the filter from `parent.filters` and calls `destroy()` on the filter.
- When an ancestor unmounts, React removes only the topmost node of the removed tree. So the core walks this tree before it destroys the tree. The walk calls `destroy()` on each filter child one time.

The walk runs in `removeChild`. The core does not use `detachDeletedInstance` for this. The reconciler of React 17 does not have this hook, and React 18 and 19 call it in the passive phase, after the commit.

A new `key` on a filter element makes a new filter. Use a new `key` when a constructor parameter changes.

An element with a `filters` prop and filter children throws an error. The error tells you to use one of the two.

Use the `filters` prop to attach a filter that the app creates and owns. The core does not destroy a filter from the `filters` prop.

Each adapter supplies tags for the filters that its PixiJS major has. For a different filter class, `PIXIFilter` registers the class as a component.

## Considered Alternatives

### Keep the `filters` prop and add a hook

A hook could create a filter, give it to the `filters` prop, and destroy it on unmount. The API would stay as it is, and the app would keep full control of the filter. But the hook must work with the StrictMode remount, and with a filter that the app gives to two objects. The library would then keep the hook and the child elements as two mechanisms for one lifecycle. The child element gives the same control with less code in the app.

### Attach filter children, but do not destroy them with an ancestor

`@pixi/react` attaches a filter element to its parent and does not walk the removed tree. This is less code in the core, and an unmount does less work. But a filter whose ancestor unmounts then leaks. The leak is not visible until the app runs for a long time.

### Make a new filter when a constructor parameter changes

The core could compare the props that only the constructor reads, and make a new filter when one of them changes. The app would not need a `key`. But the core would need a list of constructor parameters for each filter class and each PixiJS major. A new `key` gives the same result, and React supports it.

## Consequences

- A filter child does not leak when its element or an ancestor unmounts, but each removal of a display object walks its subtree.
- The filter order and filter toggles are JSX, but an element uses the `filters` prop or filter children, never both. A switch between the two needs a new `key`.
- One API works for each PixiJS major, but each adapter must keep its filter tags.
- The `filters` prop attaches a filter that the app owns, but the app must destroy that filter itself.
- A constructor parameter change needs a new `key`, but the core keeps no list of constructor parameters.
- Each element makes its own filter, but this costs little because PixiJS keeps one program for each filter class.
