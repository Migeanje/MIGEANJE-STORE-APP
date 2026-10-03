import { afterEach, describe, expect, it, vi } from "vitest";
import type { CompareItem } from "./compare-tray";
import {
  COMPARE_TRAY_KEY,
  createCompareTrayStore,
  readBrowserStorage,
} from "./compare-tray-store";

const CHARGERS = { slug: "cargadores", name: "Cargadores" };
const CABLES = { slug: "cables", name: "Cables" };

function item(slug: string, category = CHARGERS): CompareItem {
  return { slug, name: `Producto ${slug}`, category };
}

/** A Storage backed by a Map (jsdom's localStorage is shared across tests). */
function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

/** A Storage that throws on every call, like a blocked or full one. */
function brokenStorage(): Storage {
  const fail = () => {
    throw new DOMException("Blocked", "SecurityError");
  };
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createCompareTrayStore", () => {
  it("starts from the saved tray", () => {
    const storage = memoryStorage({
      [COMPARE_TRAY_KEY]: JSON.stringify({ items: [item("a")] }),
    });
    const store = createCompareTrayStore(() => storage);

    expect(store.getSnapshot().items.map(({ slug }) => slug)).toEqual(["a"]);
  });

  it("saves every change and notifies subscribers", () => {
    const storage = memoryStorage();
    const store = createCompareTrayStore(() => storage);
    const listener = vi.fn();
    store.subscribe(listener);

    expect(store.add(item("a")).status).toBe("added");
    store.add(item("b"));
    store.remove("a");

    expect(listener).toHaveBeenCalledTimes(3);
    expect(JSON.parse(storage.getItem(COMPARE_TRAY_KEY) ?? "")).toEqual({
      items: [item("b")],
    });
  });

  it("returns the same snapshot until something changes", () => {
    const store = createCompareTrayStore(() => memoryStorage());

    expect(store.getSnapshot()).toBe(store.getSnapshot());
    const before = store.getSnapshot();
    store.add(item("a"));
    expect(store.getSnapshot()).not.toBe(before);
  });

  it("keeps at most 4 products", () => {
    const store = createCompareTrayStore(() => memoryStorage());
    for (const slug of ["a", "b", "c", "d"]) store.add(item(slug));

    expect(store.add(item("e")).status).toBe("full");
    expect(store.getSnapshot().items).toHaveLength(4);
  });

  it("asks before mixing categories, then replaces the tray when told to", () => {
    const store = createCompareTrayStore(() => memoryStorage());
    store.add(item("a"));
    const listener = vi.fn();
    store.subscribe(listener);

    expect(store.add(item("cable", CABLES))).toMatchObject({
      status: "other_category",
      current: CHARGERS,
    });
    expect(listener).not.toHaveBeenCalled();

    store.replace(item("cable", CABLES));
    expect(store.getSnapshot().items).toEqual([item("cable", CABLES)]);
  });

  it("sets the whole tray at once, notifying only on a change", () => {
    const store = createCompareTrayStore(() => memoryStorage());
    const listener = vi.fn();
    store.subscribe(listener);

    store.set([item("a"), item("b"), item("cable", CABLES)]);
    store.set([item("a"), item("b")]);

    expect(store.getSnapshot().items).toEqual([item("a"), item("b")]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("clears the tray", () => {
    const storage = memoryStorage();
    const store = createCompareTrayStore(() => storage);
    store.add(item("a"));
    store.clear();

    expect(store.getSnapshot().items).toEqual([]);
    expect(JSON.parse(storage.getItem(COMPARE_TRAY_KEY) ?? "")).toEqual({
      items: [],
    });
  });

  it("works in memory when storage is unavailable", () => {
    const store = createCompareTrayStore(() => null);
    store.add(item("a"));

    expect(store.getSnapshot().items).toEqual([item("a")]);
  });

  it("works in memory when storage throws", () => {
    const store = createCompareTrayStore(() => brokenStorage());

    expect(store.getSnapshot().items).toEqual([]);
    expect(() => store.add(item("a"))).not.toThrow();
    expect(store.getSnapshot().items).toEqual([item("a")]);
  });

  it("follows changes saved by another tab", () => {
    const storage = memoryStorage();
    const store = createCompareTrayStore(() => storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    storage.setItem(COMPARE_TRAY_KEY, JSON.stringify({ items: [item("x")] }));
    window.dispatchEvent(
      new StorageEvent("storage", { key: COMPARE_TRAY_KEY }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().items).toEqual([item("x")]);

    unsubscribe();
    window.dispatchEvent(
      new StorageEvent("storage", { key: COMPARE_TRAY_KEY }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("has an empty server snapshot", () => {
    const storage = memoryStorage({
      [COMPARE_TRAY_KEY]: JSON.stringify({ items: [item("a")] }),
    });

    expect(createCompareTrayStore(() => storage).getServerSnapshot()).toEqual({
      items: [],
    });
  });
});

describe("readBrowserStorage", () => {
  it("returns localStorage when it is available", () => {
    expect(readBrowserStorage()).toBe(window.localStorage);
  });

  it("returns null when reading localStorage throws", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(readBrowserStorage()).toBeNull();
  });
});
