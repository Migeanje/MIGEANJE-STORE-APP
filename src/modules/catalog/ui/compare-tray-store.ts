import { useSyncExternalStore } from "react";
import {
  type AddToTrayResult,
  addToTray,
  type CompareItem,
  type CompareTray,
  EMPTY_TRAY,
  parseTray,
  removeFromTray,
  replaceTray,
  serializeTray,
} from "./compare-tray";

/** localStorage key of the tray. Per browser; never sent to the server. */
export const COMPARE_TRAY_KEY = "migeanje:comparar";

export type CompareTrayStore = {
  getSnapshot(): CompareTray;
  /** Always empty: the server cannot know a browser's tray. */
  getServerSnapshot(): CompareTray;
  subscribe(listener: () => void): () => void;
  add(item: CompareItem): AddToTrayResult;
  remove(slug: string): void;
  /** Starts over with only this product. */
  replace(item: CompareItem): void;
  /** Starts over with these products (sanitized like a saved tray). */
  set(items: readonly CompareItem[]): void;
  clear(): void;
};

/**
 * localStorage, or null when the browser blocks it: reading the property
 * itself throws in some private modes and sandboxed frames.
 */
export function readBrowserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * The tray as an external store for `useSyncExternalStore`. It lives in
 * memory and is mirrored to storage on every change; storage is read once,
 * lazily, and again when another tab changes it. Any storage failure (none,
 * blocked, full) leaves a working in-memory tray for this page view.
 */
export function createCompareTrayStore(
  getStorage: () => Storage | null = readBrowserStorage,
  key: string = COMPARE_TRAY_KEY,
): CompareTrayStore {
  let tray: CompareTray | null = null;
  const listeners = new Set<() => void>();

  function load(): CompareTray {
    try {
      return parseTray(getStorage()?.getItem(key) ?? null);
    } catch {
      return EMPTY_TRAY;
    }
  }

  function current(): CompareTray {
    tray ??= load();
    return tray;
  }

  function commit(next: CompareTray) {
    tray = next;
    try {
      getStorage()?.setItem(key, serializeTray(next));
    } catch {
      // Storage blocked or full: the tray still works for this page view.
    }
    for (const listener of listeners) listener();
  }

  function handleStorage(event: StorageEvent) {
    // `key` is null when another tab cleared the whole storage.
    if (event.key !== null && event.key !== key) return;
    tray = load();
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: current,
    getServerSnapshot: () => EMPTY_TRAY,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        window.addEventListener("storage", handleStorage);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener("storage", handleStorage);
        }
      };
    },
    add(item) {
      const result = addToTray(current(), item);
      if (result.status === "added") commit(result.tray);
      return result;
    },
    remove(slug) {
      commit(removeFromTray(current(), slug));
    },
    replace(item) {
      commit(replaceTray(item));
    },
    set(items) {
      const next = items.reduce<CompareTray>(
        (tray, item) => addToTray(tray, item).tray,
        EMPTY_TRAY,
      );
      if (serializeTray(next) !== serializeTray(current())) commit(next);
    },
    clear() {
      commit(EMPTY_TRAY);
    },
  };
}

/** The tray shared by every component of the page (and, via storage, tabs). */
export const compareTrayStore = createCompareTrayStore();

/** The current tray; re-renders on every change. Client components only. */
export function useCompareTray(
  store: CompareTrayStore = compareTrayStore,
): CompareTray {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}
