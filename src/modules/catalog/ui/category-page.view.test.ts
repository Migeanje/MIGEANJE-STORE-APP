// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  type CategoryListing,
  listCategoryProducts,
} from "@/modules/catalog/application/list-category-products";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import {
  buildTestCatalog,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import { parseCategorySearchParams } from "./catalog-url";
import {
  buildCategoryPageView,
  CATEGORY_PAGE_SIZE,
} from "./category-page.view";

const repository = createInMemoryCatalogRepository(buildTestCatalog());

/** The view for a chargers URL query, as the container builds it. */
async function viewFor(search: string) {
  const query = parseCategorySearchParams(
    new URLSearchParams(search),
    CHARGERS,
  );
  const listing = (await listCategoryProducts(repository, "cargadores", {
    filters: query.filters,
    sort: query.sort,
    pagination: { page: query.page, pageSize: CATEGORY_PAGE_SIZE },
  })) as CategoryListing;
  return buildCategoryPageView(listing, query.sort);
}

describe("buildCategoryPageView", () => {
  it("offers the useful filters: brand, availability, ranges, options and features", async () => {
    const view = await viewFor("");

    expect(view.filterGroups).toEqual([
      {
        kind: "checkboxes",
        legend: "Marca",
        options: [
          {
            name: "marca",
            value: "anker",
            label: "Anker",
            count: 2,
            checked: false,
          },
          {
            name: "marca",
            value: "ugreen",
            label: "UGREEN",
            count: 2,
            checked: false,
          },
        ],
      },
      {
        kind: "checkboxes",
        legend: "Disponibilidad",
        options: [
          {
            name: "disponibilidad",
            value: "en-stock",
            label: "En stock",
            count: 2,
            checked: false,
          },
          {
            name: "disponibilidad",
            value: "en-importacion",
            label: "En importación",
            count: 1,
            checked: false,
          },
          {
            name: "disponibilidad",
            value: "agotado",
            label: "Agotado",
            count: 1,
            checked: false,
          },
        ],
      },
      {
        kind: "range",
        legend: "Potencia máxima",
        unit: "W",
        min: 20,
        max: 100,
        from: { name: "potencia-desde" },
        to: { name: "potencia-hasta" },
      },
      {
        kind: "checkboxes",
        legend: "Puertos",
        options: [
          {
            name: "puertos",
            value: "USB-A",
            label: "USB-A",
            count: 2,
            checked: false,
          },
          {
            name: "puertos",
            value: "USB-C",
            label: "USB-C",
            count: 4,
            checked: false,
          },
        ],
      },
      {
        kind: "checkboxes",
        legend: "Tecnología",
        options: [
          {
            name: "tecnologia",
            value: "GaN",
            label: "GaN",
            count: 3,
            checked: false,
          },
          {
            name: "tecnologia",
            value: "Silicio",
            label: "Silicio",
            count: 1,
            checked: false,
          },
        ],
      },
      {
        kind: "checkboxes",
        legend: "Características",
        options: [
          {
            name: "pantalla",
            value: "si",
            label: "Pantalla",
            count: 1,
            checked: false,
          },
        ],
      },
    ]);
  });

  it("checks and fills the applied filters", async () => {
    const view = await viewFor(
      "marca=ugreen&potencia=30-&pantalla=si&puertos=USB-A",
    );

    const [brand, , power, ports, , features] = view.filterGroups;
    expect(brand).toMatchObject({
      options: [{ checked: false }, { checked: true }],
    });
    expect(power).toMatchObject({
      from: { name: "potencia-desde", value: 30 },
      to: { name: "potencia-hasta" },
    });
    expect(ports).toMatchObject({
      options: [{ value: "USB-A", checked: true }, { checked: false }],
    });
    expect(features).toMatchObject({ options: [{ checked: true }] });
  });

  it("lists the applied filters as chips that each remove one value", async () => {
    const view = await viewFor(
      "orden=precio-asc&pagina=1&marca=anker&disponibilidad=en-stock&potencia=30-120&puertos=USB-A&pantalla=si",
    );

    expect(view.activeFilters).toEqual([
      {
        label: "Anker",
        removeHref:
          "/categorias/cargadores?disponibilidad=en-stock&potencia=30-120&puertos=USB-A&pantalla=si&orden=precio-asc",
      },
      {
        label: "En stock",
        removeHref:
          "/categorias/cargadores?marca=anker&potencia=30-120&puertos=USB-A&pantalla=si&orden=precio-asc",
      },
      {
        label: "Potencia máxima: 30–120 W",
        removeHref:
          "/categorias/cargadores?marca=anker&disponibilidad=en-stock&puertos=USB-A&pantalla=si&orden=precio-asc",
      },
      {
        label: "Puertos: USB-A",
        removeHref:
          "/categorias/cargadores?marca=anker&disponibilidad=en-stock&potencia=30-120&pantalla=si&orden=precio-asc",
      },
      {
        label: "Pantalla",
        removeHref:
          "/categorias/cargadores?marca=anker&disponibilidad=en-stock&potencia=30-120&puertos=USB-A&orden=precio-asc",
      },
    ]);
    expect(view.activeCount).toBe(5);
    expect(view.clearHref).toBe("/categorias/cargadores?orden=precio-asc");
  });

  it.each([
    ["potencia=30-", "Potencia máxima: desde 30 W"],
    ["potencia=-60", "Potencia máxima: hasta 60 W"],
    ["potencia=65", "Potencia máxima: 65 W"],
  ])("labels the range %s as %s", async (search, label) => {
    expect((await viewFor(search)).activeFilters[0]?.label).toBe(label);
  });

  it("drops brands and options the category does not offer from the chips", async () => {
    const view = await viewFor("marca=sony&puertos=Lightning");

    expect(view.activeFilters).toEqual([]);
    expect(view.canonicalHref).toBe("/categorias/cargadores");
  });

  it("keeps the sort in the filter form and the filters in the sort form", async () => {
    const view = await viewFor("marca=anker&orden=precio-desc&pagina=1");

    expect(view.filterHiddenFields).toEqual([
      { name: "orden", value: "precio-desc" },
    ]);
    expect(view.sort).toEqual({
      name: "orden",
      value: "precio-desc",
      options: [
        { value: "relevancia", label: "Relevancia" },
        { value: "precio-asc", label: "Precio: menor a mayor" },
        { value: "precio-desc", label: "Precio: mayor a menor" },
      ],
      hiddenFields: [{ name: "marca", value: "anker" }],
    });
    expect((await viewFor("")).filterHiddenFields).toEqual([]);
  });

  it("counts the results against the whole category", async () => {
    expect((await viewFor("")).count).toBe("4 productos");
    expect((await viewFor("marca=ugreen")).count).toBe("2 de 4 productos");
  });

  it("maps the results to product cards in the requested order", async () => {
    const view = await viewFor("orden=precio-asc");

    expect(view.products.map(({ href }) => href)).toEqual([
      "/productos/cargador-basico-20w",
      "/productos/nexode-65w",
      "/productos/prime-100w",
      "/productos/nano-45w",
    ]);
  });

  it("builds page links that keep the filters and sort", async () => {
    const view = await viewFor("marca=anker&orden=precio-asc");

    expect(view.pagination).toEqual({ page: 1, pageCount: 1 });
    expect(view.hrefForPage(2)).toBe(
      "/categorias/cargadores?marca=anker&orden=precio-asc&pagina=2",
    );
    expect(view.hrefForPage(1)).toBe(
      "/categorias/cargadores?marca=anker&orden=precio-asc",
    );
  });

  it("hides groups that cannot narrow the results", async () => {
    const onlyAnker = createInMemoryCatalogRepository({
      ...buildTestCatalog(),
      products: buildTestCatalog().products.filter(
        (product) => product.brand.slug === "anker",
      ),
    });
    const listing = (await listCategoryProducts(
      onlyAnker,
      "cargadores",
    )) as CategoryListing;

    const legends = buildCategoryPageView(listing, "featured").filterGroups.map(
      (group) => group.legend,
    );
    // One brand, both GaN: nothing to choose between.
    expect(legends).not.toContain("Marca");
    expect(legends).not.toContain("Tecnología");
    expect(legends).toContain("Disponibilidad");
  });
});
