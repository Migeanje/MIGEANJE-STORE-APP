// Customer-facing copy shared by the catalog pages (neutral Peruvian Spanish).
import type { OptionBlock } from "@/modules/catalog/domain/variant-selection";

const COUNT_FORMAT = new Intl.NumberFormat("es-PE");

function products(count: number): string {
  return `${COUNT_FORMAT.format(count)} ${count === 1 ? "producto" : "productos"}`;
}

/** "1 producto", "4 productos". */
export function productCountLabel(count: number): string {
  return products(count);
}

/** The search page title: "Resultados para «cable»", or "Buscar productos". */
export function searchTitle(query: string): string {
  return query === "" ? "Buscar productos" : `Resultados para «${query}»`;
}

/** "4 productos" when nothing is filtered out, "2 de 4 productos" otherwise. */
export function resultCountLabel(shown: number, total: number): string {
  return shown === total
    ? products(total)
    : `${COUNT_FORMAT.format(shown)} de ${products(total)}`;
}

/** "15–20 días", "3 días", "1 día". */
export function leadTimeLabel({
  min,
  max,
}: {
  min: number;
  max: number;
}): string {
  return min === max
    ? `${min} ${min === 1 ? "día" : "días"}`
    : `${min}–${max} días`;
}

/**
 * The product page explainer for a backorder ("En importación").
 * DRAFT: copy pending owner review.
 */
export function backorderNote(leadTimeDays: {
  min: number;
  max: number;
}): string {
  return `En importación: lo pedimos para ti y llega en ${leadTimeLabel(leadTimeDays)}; pagas hoy y te avisamos en cada paso.`;
}

/** Why a variant option value cannot be chosen, shown next to it. */
export function blockedOptionLabel(block: OptionBlock): string {
  switch (block.kind) {
    case "combination":
      return `No disponible con ${block.option.label.toLocaleLowerCase("es-PE")} ${block.value}`;
    case "sold_out":
      return "Agotado";
  }
}
