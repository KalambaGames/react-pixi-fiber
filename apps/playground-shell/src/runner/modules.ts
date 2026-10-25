export function createModuleRequire(modules: Record<string, unknown>): (id: string) => unknown {
  return id => {
    if (!Object.hasOwn(modules, id)) {
      throw new Error(`Cannot import "${id}". Available modules: ${Object.keys(modules).join(", ")}`);
    }
    const value = modules[id];
    return typeof value === "object" && value !== null ? { ...value, __esModule: true } : value;
  };
}
