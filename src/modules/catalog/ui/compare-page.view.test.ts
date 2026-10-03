// @vitest-environment node
import { describe, expect, it } from "vitest";
import { compareProducts } from "@/modules/catalog/application/compare-products";
import type { Product } from "@/modules/catalog/domain/product";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import { buildTestCatalog } from "@/modules/catalog/testing/catalog-builders";
import {
  buildComparisonProblemView,
  buildComparisonView,
} from "./compare-page.view";

const catalog = buildTestCatalog();
const repository = createInMemoryCatalogRepository(catalog);

function products(...slugs: string[]): Product[] {
  return slugs.map((slug) => {
    const found = catalog.products.find((product) => product.slug === slug);
    if (!found) throw new Error(`No test product "${slug}"`);
    return found;
  });
}

async function view(differencesOnly = false) {
  const comparison = await compareProducts(repository, [
    "prime-100w",
    "nexode-65w",
  ]);
  return buildComparisonView(comparison, differencesOnly);
}

describe("buildComparisonView", () => {
  it("titles the comparison with its category", async () => {
    expect((await view()).title).toBe("Comparar cargadores");
  });

  it("builds one column per product, in order, with a link to remove it", async () => {
    const { columns } = await view();

    expect(columns.map(({ name }) => name)).toEqual([
      "Prime Charger 100W",
      "Nexode Cargador 65W",
    ]);
    expect(columns[1]).toEqual({
      slug: "nexode-65w",
      href: "/productos/nexode-65w",
      name: "Nexode Cargador 65W",
      brand: "UGREEN",
      image: catalog.products[2]?.images[0],
      price: { amount: 12990, compareAt: 15990 },
      availability: { status: "in_stock", label: "En stock" },
      removeHref: "/comparar?productos=prime-100w",
    });
  });

  it("formats every comparable row, with units and gaps", async () => {
    const { rows } = await view();

    expect(rows).toEqual([
      {
        key: "maxPower",
        label: "Potencia máxima",
        values: ["100 W", "65 W"],
        differs: true,
      },
      {
        key: "ports",
        label: "Puertos",
        values: ["USB-C, USB-A", "USB-C, USB-A"],
        differs: false,
      },
      {
        key: "technology",
        label: "Tecnología",
        values: ["GaN", "GaN"],
        differs: false,
      },
      {
        key: "display",
        label: "Pantalla",
        values: ["No", "No"],
        differs: false,
      },
      {
        key: "weight",
        label: "Peso",
        values: ["170 g", null],
        differs: true,
      },
    ]);
  });

  it("offers to show only the differences", async () => {
    const result = await view();

    expect(result.differencesOnly).toBe(false);
    expect(result.toggle).toEqual({
      href: "/comparar?productos=prime-100w,nexode-65w&diferencias=si",
      label: "Mostrar solo diferencias",
    });
    expect(result.rowsLabel).toBe("5 especificaciones");
  });

  it("keeps only the rows that differ, and offers to show them all again", async () => {
    const result = await view(true);

    expect(result.rows.map(({ key }) => key)).toEqual(["maxPower", "weight"]);
    expect(result.toggle).toEqual({
      href: "/comparar?productos=prime-100w,nexode-65w",
      label: "Mostrar todas las especificaciones",
    });
    expect(result.rowsLabel).toBe("2 de 5 especificaciones son diferentes");
  });

  it("says so when nothing differs", async () => {
    const comparison = await compareProducts(repository, [
      "prime-100w",
      "nexode-65w",
    ]);
    const same = {
      ...comparison,
      rows: comparison.rows.map((row) => ({ ...row, differs: false })),
    };

    const result = buildComparisonView(same, true);

    expect(result.rows).toEqual([]);
    expect(result.rowsLabel).toBe(
      "Estos productos no tienen diferencias en sus especificaciones",
    );
  });

  it("links back to the category", async () => {
    expect((await view()).categoryHref).toBe("/categorias/cargadores");
  });
});

describe("buildComparisonProblemView", () => {
  it("invites to pick products when there are none", () => {
    expect(
      buildComparisonProblemView({ reason: "count", slugs: [], found: [] }),
    ).toEqual({
      title: "Elige qué comparar",
      description:
        "Abre un producto y toca «Comparar». Puedes comparar de 2 a 4 productos de una misma categoría.",
      actions: [],
      showCategories: true,
    });
  });

  it("asks for another product when there is only one", () => {
    expect(
      buildComparisonProblemView({
        reason: "count",
        slugs: ["prime-100w"],
        found: products("prime-100w"),
      }),
    ).toEqual({
      title: "Agrega otro producto para comparar",
      description:
        "Necesitas al menos 2 productos de una misma categoría para compararlos.",
      actions: [
        { href: "/categorias/cargadores", label: "Ver más cargadores" },
      ],
      showCategories: false,
    });
  });

  it("offers the first four when there are too many", () => {
    const slugs = ["a", "b", "c", "d", "e"];

    expect(
      buildComparisonProblemView({ reason: "count", slugs, found: [] }),
    ).toEqual({
      title: "Puedes comparar hasta 4 productos",
      description: "Quita alguno para ver la comparación.",
      actions: [
        {
          href: "/comparar?productos=a,b,c,d",
          label: "Comparar los primeros 4",
        },
      ],
      showCategories: false,
    });
  });

  it("offers to compare the products that were found", () => {
    expect(
      buildComparisonProblemView({
        reason: "not_found",
        slugs: ["prime-100w", "nope", "nexode-65w"],
        found: products("prime-100w", "nexode-65w"),
      }),
    ).toEqual({
      title: "No encontramos algunos productos",
      description:
        "Puede que el enlace esté incompleto o que ya no vendamos alguno de ellos.",
      actions: [
        {
          href: "/comparar?productos=prime-100w,nexode-65w",
          label: "Comparar los 2 que sí encontramos",
        },
      ],
      showCategories: false,
    });
  });

  it("sends to the categories when too few products were found", () => {
    expect(
      buildComparisonProblemView({
        reason: "not_found",
        slugs: ["nope", "nada"],
        found: [],
      }),
    ).toMatchObject({ actions: [], showCategories: true });
  });

  it("splits mixed categories into comparisons or category links", () => {
    expect(
      buildComparisonProblemView({
        reason: "mixed_categories",
        slugs: ["prime-100w", "cable-usb-c-1m", "nexode-65w"],
        found: products("prime-100w", "cable-usb-c-1m", "nexode-65w"),
      }),
    ).toEqual({
      title: "Solo puedes comparar productos de una misma categoría",
      description:
        "Elegiste productos de cargadores y cables. Elige una categoría para compararlos.",
      actions: [
        {
          href: "/comparar?productos=prime-100w,nexode-65w",
          label: "Comparar 2 cargadores",
        },
        { href: "/categorias/cables", label: "Ver cables" },
      ],
      showCategories: false,
    });
  });

  it("compares each product once when one is repeated", () => {
    expect(
      buildComparisonProblemView({
        reason: "duplicate",
        slugs: ["prime-100w", "prime-100w", "nexode-65w"],
        found: products("prime-100w", "nexode-65w"),
      }),
    ).toEqual({
      title: "Repetiste un producto",
      description: "Cada producto puede aparecer una sola vez.",
      actions: [
        {
          href: "/comparar?productos=prime-100w,nexode-65w",
          label: "Comparar sin repetir",
        },
      ],
      showCategories: false,
    });
  });

  it("owns a data problem without blaming the customer", () => {
    expect(
      buildComparisonProblemView({
        reason: "category_not_found",
        slugs: ["prime-100w", "nexode-65w"],
        found: products("prime-100w", "nexode-65w"),
      }),
    ).toEqual({
      title: "No pudimos armar esta comparación",
      description:
        "Es un problema de nuestro lado. Inténtalo más tarde o sigue explorando.",
      actions: [],
      showCategories: true,
    });
  });
});
