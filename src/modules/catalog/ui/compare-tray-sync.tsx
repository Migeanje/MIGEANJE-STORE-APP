"use client";

import { useEffect } from "react";
import type { CompareItem } from "./compare-tray";
import { type CompareTrayStore, compareTrayStore } from "./compare-tray-store";

export type CompareTraySyncProps = {
  /** The products the comparator shows, in order. */
  items: readonly CompareItem[];
  /** Defaults to the page-wide tray (tests pass their own). */
  store?: CompareTrayStore;
};

/**
 * Makes the compare tray follow the comparator URL, so "Agregar otro
 * producto" and the product pages' "Comparar" continue from what is on
 * screen (also for a shared link). Renders nothing.
 */
export function CompareTraySync({
  items,
  store = compareTrayStore,
}: CompareTraySyncProps) {
  const key = items.map(({ slug }) => slug).join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` identifies `items`; a new array with the same products must not write again.
  useEffect(() => {
    store.set(items);
  }, [key, store]);
  return null;
}
