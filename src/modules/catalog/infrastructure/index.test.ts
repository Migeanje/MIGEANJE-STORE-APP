// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCatalogRepository } from "./index";

// Outside Next.js the real package throws on import; here it is a no-op.
vi.mock("server-only", () => ({}));

describe("getCatalogRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the mock adapter when DATA_SOURCE is unset or empty", async () => {
    vi.stubEnv("DATA_SOURCE", undefined);
    expect((await getCatalogRepository().listProducts()).total).toBe(19);

    vi.stubEnv("DATA_SOURCE", "");
    expect((await getCatalogRepository().listProducts()).total).toBe(19);
  });

  it("uses the mock adapter for DATA_SOURCE=mock, created once", () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    expect(getCatalogRepository()).toBe(getCatalogRepository());
  });

  it("throws a clear error for DATA_SOURCE=medusa until F3", () => {
    vi.stubEnv("DATA_SOURCE", "medusa");

    expect(() => getCatalogRepository()).toThrow(
      "DATA_SOURCE=medusa is not implemented yet",
    );
  });

  it("throws for an unknown DATA_SOURCE", () => {
    vi.stubEnv("DATA_SOURCE", "postgres");

    expect(() => getCatalogRepository()).toThrow(
      'Unknown DATA_SOURCE "postgres". Expected one of: mock, medusa',
    );
  });
});
