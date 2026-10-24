import { hashCode } from "./share";

export interface CodeStore {
  load(id: string, original: string): { changedUpstream: boolean; code: string; originalHash: string } | null;
  save(id: string, code: string, original: string, originalHash?: string): void;
  reset(id: string): void;
  markRunning(id: string): void;
  clearRunning(id: string): void;
  wasRunning(id: string): boolean;
}

function defaultStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// Blocked storage reads as empty and drops writes. Writing null removes the key.
export function safeStorage(storage: Storage | null = defaultStorage()) {
  return {
    get(key: string): string | null {
      try {
        return storage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set(key: string, value: string | null): void {
      try {
        if (value === null) storage?.removeItem(key);
        else storage?.setItem(key, value);
      } catch {}
    },
  };
}

export const browserStorage = safeStorage();

export function createStore(pixiMajor: number, storage: Storage | null = defaultStorage()): CodeStore {
  const key = (id: string) => `playground:pixi-${pixiMajor}:${id}`;
  const runningKey = `playground:pixi-${pixiMajor}-running`;
  const { get, set } = safeStorage(storage);
  return {
    load(id, original) {
      try {
        const saved = JSON.parse(get(key(id)) ?? "null");
        if (typeof saved?.code !== "string") return null;
        return {
          changedUpstream: saved.originalHash !== hashCode(original),
          code: saved.code,
          originalHash: saved.originalHash,
        };
      } catch {
        return null;
      }
    },
    save(id, code, original, originalHash = hashCode(original)) {
      set(key(id), JSON.stringify({ code, originalHash }));
    },
    reset(id) {
      set(key(id), null);
    },
    markRunning(id) {
      set(runningKey, id);
    },
    clearRunning(id) {
      if (get(runningKey) === id) set(runningKey, null);
    },
    wasRunning(id) {
      return get(runningKey) === id;
    },
  };
}
