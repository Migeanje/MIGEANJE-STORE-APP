// Composition root of the catalog module. `server-only` turns an import from
// a Client Component into a build error: this file reads server environment
// variables and, from F3, will build the Medusa client with its credentials.
import "server-only";
import type { CatalogRepository } from "@/modules/catalog/application/catalog-repository";
import { createMockCatalogRepository } from "./catalog.mock";

export const DATA_SOURCES = ["mock", "medusa"] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

let mockRepository: CatalogRepository | undefined;

/**
 * The catalog adapter selected by `DATA_SOURCE` (`mock` when unset or empty).
 * Server Components and server actions call this and pass the repository to
 * the use cases; nothing else imports an adapter. Throws for `medusa` (not
 * implemented until F3) and for unknown values.
 */
export function getCatalogRepository(): CatalogRepository {
  const source = process.env.DATA_SOURCE?.trim() || "mock";
  switch (source) {
    case "mock":
      mockRepository ??= createMockCatalogRepository();
      return mockRepository;
    case "medusa":
      throw new Error(
        "DATA_SOURCE=medusa is not implemented yet: the Medusa catalog adapter arrives in F3. Use DATA_SOURCE=mock.",
      );
    default:
      throw new Error(
        `Unknown DATA_SOURCE "${source}". Expected one of: ${DATA_SOURCES.join(", ")}.`,
      );
  }
}
