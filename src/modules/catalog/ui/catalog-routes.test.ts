// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { mockCatalog } from "@/modules/catalog/infrastructure/catalog.mock";
import {
  brandMetadata,
  brandStaticParams,
  categoryMetadata,
  categoryStaticParams,
  searchMetadata,
} from "./catalog-routes";

vi.mock("server-only", () => ({}));

describe("categoryStaticParams", () => {
  it("lists every category slug", async () => {
    expect(await categoryStaticParams()).toEqual(
      mockCatalog.categories.map(({ slug }) => ({ slug })),
    );
  });
});

describe("categoryMetadata", () => {
  it("titles the page with the category and points to its canonical URL", async () => {
    const count = mockCatalog.products.filter(
      (product) => product.category.slug === "cables",
    ).length;

    expect(await categoryMetadata("cables")).toEqual({
      title: "Cables",
      description: `Cables en Migeanje Store: ${count} productos elegidos con criterio, con precios en soles.`,
      alternates: { canonical: "/categorias/cables" },
    });
  });

  it("is empty for an unknown category (the page answers 404)", async () => {
    expect(await categoryMetadata("drones")).toEqual({});
  });
});

describe("brandStaticParams", () => {
  it("lists every brand slug", async () => {
    expect(await brandStaticParams()).toEqual(
      mockCatalog.brands.map(({ slug }) => ({ slug })),
    );
  });
});

describe("brandMetadata", () => {
  it("titles the page with the brand and points to its canonical URL", async () => {
    const count = mockCatalog.products.filter(
      (product) => product.brand.slug === "ugreen",
    ).length;

    expect(await brandMetadata("ugreen")).toEqual({
      title: "UGREEN",
      description: `UGREEN en Migeanje Store: ${count} productos elegidos con criterio, con precios en soles.`,
      alternates: { canonical: "/marcas/ugreen" },
    });
  });

  it("is empty for an unknown brand (the page answers 404)", async () => {
    expect(await brandMetadata("xiaomi")).toEqual({});
  });
});

describe("searchMetadata", () => {
  it("echoes the normalized query and keeps results out of search engines", () => {
    expect(searchMetadata({ q: "  power   bank " })).toEqual({
      title: "Resultados para «power bank»",
      robots: { index: false },
    });
  });

  it("falls back to a plain title without a query", () => {
    expect(searchMetadata({})).toEqual({
      title: "Buscar productos",
      robots: { index: false },
    });
  });
});
