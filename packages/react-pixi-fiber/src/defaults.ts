// The value PixiJS had for a prop before the core first wrote it, per instance. A removal restores it.
const recorded = new WeakMap<object, Map<string, unknown>>();

export function recordDefault(
  instance: any,
  propName: string,
  isPoint: (value: unknown) => boolean,
  clonePoint?: (point: any) => unknown
): void {
  let values = recorded.get(instance);
  if (!values) {
    values = new Map();
    recorded.set(instance, values);
  }
  if (values.has(propName)) return;
  const current = instance[propName];
  values.set(
    propName,
    isPoint(current) ? (clonePoint ? clonePoint(current) : { x: current.x, y: current.y }) : current
  );
}

export function getRecordedDefault(instance: object, propName: string): unknown {
  const values = recorded.get(instance);
  return values === undefined ? undefined : values.get(propName);
}
