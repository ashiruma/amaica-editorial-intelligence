/**
 * Safe storage abstraction for Amaica Media.
 * Defensively handles private browsing, TOR browser, iframe sandboxes,
 * and environments where localStorage access throws DOMException: SecurityError.
 */

const inMemoryStore = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const testKey = "__amaica_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = isLocalStorageAvailable();

export function safeGetItem(key: string): string | null {
  try {
    if (hasLocalStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // Ignore DOMException / SecurityError
  }
  return inMemoryStore.get(key) ?? null;
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (hasLocalStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore DOMException / SecurityError
  }
  inMemoryStore.set(key, value);
}

export function safeRemoveItem(key: string): void {
  try {
    if (hasLocalStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore DOMException / SecurityError
  }
  inMemoryStore.delete(key);
}

/**
 * Universal fallback Storage object matching the standard Web Storage interface.
 * Passed to Supabase client so it never crashes in TOR or strict privacy windows.
 */
export const resilientStorage: Storage = {
  getItem: (key: string) => safeGetItem(key),
  setItem: (key: string, value: string) => safeSetItem(key, value),
  removeItem: (key: string) => safeRemoveItem(key),
  clear: () => {
    try {
      if (hasLocalStorage) window.localStorage.clear();
    } catch {}
    inMemoryStore.clear();
  },
  key: (index: number) => {
    try {
      if (hasLocalStorage) return window.localStorage.key(index);
    } catch {}
    return Array.from(inMemoryStore.keys())[index] ?? null;
  },
  get length(): number {
    try {
      if (hasLocalStorage) return window.localStorage.length;
    } catch {}
    return inMemoryStore.size;
  },
};

/**
 * Generates an RFC4122 v4 UUID safely in all contexts.
 * crypto.randomUUID() is only available in secure contexts (HTTPS / localhost).
 * When running over HTTP on LAN IPs, TOR, or proxies, this fallback ensures zero crashes.
 */
export function safeUUID(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
