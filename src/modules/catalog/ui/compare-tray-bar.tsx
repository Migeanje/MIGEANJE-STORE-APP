"use client";

import { usePathname } from "next/navigation";
import { MAX_COMPARED } from "@/modules/catalog/application/compare-products";
import { CompareBar } from "@/shared/ui/organisms/compare-bar";
import { COMPARE_PATH, compareHref } from "./catalog-url";
import { trayCategory } from "./compare-tray";
import {
  type CompareTrayStore,
  compareTrayStore,
  useCompareTray,
} from "./compare-tray-store";

export type CompareTrayBarProps = {
  /** Defaults to the page-wide tray (tests pass their own). */
  store?: CompareTrayStore;
};

/**
 * The compare tray of the discovery pages, stuck to the bottom of the
 * viewport once something is picked. Not shown on the comparator itself, nor
 * before hydration (the tray lives in this browser's storage).
 */
export function CompareTrayBar({
  store = compareTrayStore,
}: CompareTrayBarProps) {
  const tray = useCompareTray(store);
  const pathname = usePathname();
  if (pathname === COMPARE_PATH) return null;

  const slugs = tray.items.map(({ slug }) => slug);
  return (
    <CompareBar
      items={tray.items.map(({ slug, name }) => ({ key: slug, name }))}
      categoryName={trayCategory(tray)?.name}
      max={MAX_COMPARED}
      compareHref={slugs.length >= 2 ? compareHref(slugs) : null}
      onClear={() => store.clear()}
      // The last item of <main> (a flex column): stays at the bottom of short pages.
      className="mt-auto"
    />
  );
}
