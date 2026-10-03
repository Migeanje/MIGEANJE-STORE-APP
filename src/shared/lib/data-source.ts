/** Where module adapters read and write data (see each module's composition root). */
export const DATA_SOURCES = ["mock", "medusa"] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

function isDataSource(value: string): value is DataSource {
  return (DATA_SOURCES as readonly string[]).includes(value);
}

/**
 * The `DATA_SOURCE` setting: `mock` when unset or blank. Throws for anything
 * else that is not a known data source, so a typo fails at the first request
 * instead of silently using mock data.
 */
export function readDataSource(
  value: string | undefined = process.env.DATA_SOURCE,
): DataSource {
  const source = value?.trim() || "mock";
  if (!isDataSource(source)) {
    throw new Error(
      `Unknown DATA_SOURCE "${source}". Expected one of: ${DATA_SOURCES.join(", ")}.`,
    );
  }
  return source;
}
