export type LazyModules = Record<string, () => Promise<unknown>>;

// A chunk request can hang without failing, so a lazy module that takes longer fails like one that cannot load.
const loadSeconds = 30;

function withTimeout<T>(loading: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`It did not load in ${loadSeconds} seconds.`)), loadSeconds * 1000);
  });
  return Promise.race([loading, timeout]).finally(() => clearTimeout(timer));
}

// Compiled code imports through require('name'). The lazy modules it names load before it runs. A name that is only
// in a string or a comment loads too, which costs a download and nothing else.
export async function loadImports(
  code: string,
  modules: Record<string, unknown>,
  lazyModules: LazyModules
): Promise<Record<string, unknown>> {
  const names = new Set(Array.from(code.matchAll(/require\(\s*(['"])(.+?)\1\s*\)/g), match => match[2]));
  const loaded = await Promise.all(
    [...names]
      .filter(name => Object.hasOwn(lazyModules, name))
      .map(async name => {
        try {
          return [name, await withTimeout(lazyModules[name]())] as const;
        } catch (error) {
          throw new Error(`Cannot load "${name}".`, { cause: error });
        }
      })
  );
  return { ...modules, ...Object.fromEntries(loaded) };
}

export function createModuleRequire(modules: Record<string, unknown>): (id: string) => unknown {
  return id => {
    if (!Object.hasOwn(modules, id)) {
      throw new Error(`Cannot import "${id}". Available modules: ${Object.keys(modules).join(", ")}`);
    }
    const value = modules[id];
    return typeof value === "object" && value !== null ? { ...value, __esModule: true } : value;
  };
}
