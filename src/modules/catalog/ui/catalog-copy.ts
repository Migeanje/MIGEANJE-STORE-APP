// Customer-facing copy shared by the catalog pages (neutral Peruvian Spanish).

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
