"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MAX_COMPARED } from "@/modules/catalog/application/compare-products";
import { Button } from "@/shared/ui/atoms/button";
import { Chip } from "@/shared/ui/atoms/chip";
import { compareHref } from "./catalog-url";
import type { CompareItem, CompareTrayCategory } from "./compare-tray";
import {
  type CompareTrayStore,
  compareTrayStore,
  useCompareTray,
} from "./compare-tray-store";

type Notice =
  | { kind: "added" | "removed" | "replaced"; count: number }
  | { kind: "full" }
  | { kind: "other_category"; current: CompareTrayCategory };

function lowercase(text: string): string {
  return text.toLocaleLowerCase("es-PE");
}

export type CompareToggleProps = {
  /** This product, as the tray keeps it. */
  item: CompareItem;
  /** Defaults to the page-wide tray (tests pass their own). */
  store?: CompareTrayStore;
};

/**
 * "Comparar" on the product page: a toggle (`aria-pressed`) that adds the
 * product to the compare tray or takes it out. Results are announced
 * politely. A full tray says so; a tray of another category asks, inline,
 * whether to start a new comparison with this product. Hidden without
 * JavaScript (the tray lives in the browser).
 */
export function CompareToggle({
  item,
  store = compareTrayStore,
}: CompareToggleProps) {
  const tray = useCompareTray(store);
  const [notice, setNotice] = useState<Notice | null>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const inTray = tray.items.some(({ slug }) => slug === item.slug);
  const otherSlugs = tray.items.map(({ slug }) => slug);

  function toggle(pressed: boolean) {
    if (!pressed) {
      store.remove(item.slug);
      setNotice({ kind: "removed", count: store.getSnapshot().items.length });
      return;
    }
    const result = store.add(item);
    switch (result.status) {
      case "added":
      case "already_added":
        setNotice({ kind: "added", count: result.tray.items.length });
        break;
      case "full":
        setNotice({ kind: "full" });
        break;
      case "other_category":
        setNotice({ kind: "other_category", current: result.current });
        break;
    }
  }

  // The question's buttons go away: keep focus on the toggle.
  function replace() {
    store.replace(item);
    setNotice({ kind: "replaced", count: 1 });
    chipRef.current?.focus();
  }

  function cancel() {
    setNotice(null);
    chipRef.current?.focus();
  }

  let message: string | null = null;
  switch (notice?.kind) {
    case "added":
      message = `Agregaste ${item.name} a la comparación (${notice.count} de ${MAX_COMPARED}).`;
      break;
    case "replaced":
      message = `Empezaste una nueva comparación con ${item.name}.`;
      break;
    case "removed":
      message = `Quitaste ${item.name} de la comparación.`;
      break;
    case "full":
      message = `Ya tienes ${MAX_COMPARED} productos para comparar. Quita uno para agregar este.`;
      break;
    case "other_category":
      message = `Tu comparación tiene ${lowercase(notice.current.name)}. Solo puedes comparar productos de una misma categoría. ¿Quieres empezar una nueva con este producto?`;
      break;
  }

  return (
    <div className="flex flex-col items-start gap-3 noscript:hidden">
      <Chip ref={chipRef} pressed={inTray} onPressedChange={toggle}>
        Comparar
      </Chip>
      <div aria-live="polite" className="flex flex-col items-start gap-3">
        {message ? (
          <p className="text-body-sm text-muted-foreground">{message}</p>
        ) : null}
        {notice?.kind === "other_category" ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={replace}>
              Empezar nueva comparación
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancelar
            </Button>
          </div>
        ) : null}
        {notice?.kind === "full" ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={compareHref(otherSlugs)}>Ver la comparación</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
