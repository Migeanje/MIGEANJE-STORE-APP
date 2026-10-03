// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { ProductDetails } from "@/modules/catalog/application/get-product";
import { resolveSpecs } from "@/modules/catalog/domain/category";
import {
  type Product,
  productAvailability,
  productPrice,
} from "@/modules/catalog/domain/product";
import {
  buildProduct,
  buildTestCatalog,
  buildVariant,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import { buildProductPageView, MAX_QUANTITY } from "./product-page.view";

function details(product: Product): ProductDetails {
  return {
    product,
    category: CHARGERS,
    specs: resolveSpecs(product.specs, CHARGERS),
    price: productPrice(product),
    availability: productAvailability(product),
  };
}

function testProduct(slug: string): Product {
  const found = buildTestCatalog().products.find(
    (product) => product.slug === slug,
  );
  if (!found) throw new Error(`No test product "${slug}"`);
  return found;
}

const nano = details(testProduct("nano-45w"));

describe("buildProductPageView", () => {
  describe("variant", () => {
    it("shows the default variant without a SKU (the earliest arrival here)", () => {
      expect(buildProductPageView(nano).variant.sku).toBe("NANO-45-BLK");
    });

    it("shows the requested variant", () => {
      expect(buildProductPageView(nano, "NANO-45-WHT").variant.sku).toBe(
        "NANO-45-WHT",
      );
    });

    it("falls back to the default variant for an unknown SKU", () => {
      expect(buildProductPageView(nano, "NOPE").variant.sku).toBe(
        "NANO-45-BLK",
      );
    });
  });

  describe("option groups", () => {
    it("links each value to its variant; the default variant has no param", () => {
      const view = buildProductPageView(nano, "NANO-45-WHT");

      expect(view.optionGroups).toEqual([
        {
          key: "color",
          label: "Color",
          selectedValue: "Blanco",
          values: [
            {
              value: "Blanco",
              selected: true,
              href: "/productos/nano-45w?variante=nano-45-wht",
            },
            {
              value: "Negro",
              selected: false,
              href: "/productos/nano-45w",
            },
          ],
        },
      ]);
    });

    it("explains why a value cannot be chosen", () => {
      const product = buildProduct({
        slug: "con-colores",
        options: [{ key: "color", label: "Color" }],
        variants: [
          buildVariant({ sku: "X-WHT", options: { color: "Blanco" } }),
          buildVariant({
            sku: "X-BLK",
            options: { color: "Negro" },
            availability: { status: "unavailable" },
          }),
        ],
      });

      const [group] = buildProductPageView(details(product)).optionGroups;

      expect(group?.values[1]).toEqual({
        value: "Negro",
        selected: false,
        unavailableLabel: "Agotado",
      });
    });

    it("is empty for a single-variant product", () => {
      expect(
        buildProductPageView(details(testProduct("prime-100w"))).optionGroups,
      ).toEqual([]);
    });
  });

  describe("price and availability", () => {
    it("uses the selected variant's price and previous price", () => {
      const view = buildProductPageView(details(testProduct("nexode-65w")));

      expect(view.price).toEqual({ amount: 12990, compareAt: 15990 });
    });

    it("labels the selected variant's availability", () => {
      expect(buildProductPageView(nano, "NANO-45-WHT").availability).toEqual({
        status: "backorder",
        label: "En importación · llega en 15–20 días",
      });
    });
  });

  describe("purchase", () => {
    it("sells in-stock products up to the in-stock maximum", () => {
      expect(
        buildProductPageView(details(testProduct("prime-100w"))).purchase,
      ).toEqual({ kind: "buy", maxQuantity: MAX_QUANTITY.in_stock });
    });

    it("sells backorders up to their own maximum, with an explainer", () => {
      expect(buildProductPageView(nano, "NANO-45-WHT").purchase).toEqual({
        kind: "buy",
        maxQuantity: MAX_QUANTITY.backorder,
        note: "En importación: lo pedimos para ti y llega en 15–20 días; pagas hoy y te avisamos en cada paso.",
      });
    });

    it("offers 'Avísame' for unavailable products", () => {
      expect(
        buildProductPageView(details(testProduct("cargador-basico-20w")))
          .purchase,
      ).toEqual({ kind: "notify" });
    });
  });

  describe("specs", () => {
    it("lists the present specs in display order, formatted", () => {
      expect(
        buildProductPageView(details(testProduct("prime-100w"))).specs,
      ).toEqual([
        { label: "Potencia máxima", value: "100", unit: "W" },
        { label: "Puertos", value: "USB-C, USB-A" },
        { label: "Tecnología", value: "GaN" },
        { label: "Pantalla", value: "No" },
        { label: "Peso", value: "170", unit: "g" },
      ]);
    });
  });

  describe("review", () => {
    it("is null without an expert review", () => {
      expect(buildProductPageView(nano).review).toBeNull();
    });

    it("maps the expert review", () => {
      const review = {
        verdict: "Muy bueno.",
        forWhom: ["Viajeros"],
        notFor: ["Gamers"],
        rubric: [{ criterion: "Potencia", score: 4, note: "Suficiente." }],
      };
      const product = buildProduct({ expertReview: review });

      expect(buildProductPageView(details(product)).review).toEqual(review);
    });
  });

  describe("structured data", () => {
    it("describes the product and the selected variant's offer", () => {
      const view = buildProductPageView(nano, "NANO-45-WHT");

      expect(view.jsonLd).toEqual({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Nano Charger 45W",
        description: "Un cargador para pruebas.",
        sku: "NANO-45-WHT",
        mpn: "A121D",
        category: "Cargadores",
        image: ["/mock/products/cargadores.svg"],
        brand: { "@type": "Brand", name: "Anker" },
        offers: {
          "@type": "Offer",
          price: "248.90",
          priceCurrency: "PEN",
          availability: "https://schema.org/BackOrder",
          itemCondition: "https://schema.org/NewCondition",
        },
      });
    });

    it.each([
      ["prime-100w", "https://schema.org/InStock"],
      ["cargador-basico-20w", "https://schema.org/OutOfStock"],
    ])("maps the availability of %s to %s", (slug, availability) => {
      const view = buildProductPageView(details(testProduct(slug)));

      expect(view.jsonLd.offers).toMatchObject({ availability });
      expect(view.jsonLd).not.toHaveProperty("mpn");
    });
  });
});

describe("MAX_QUANTITY", () => {
  it("allows fewer units on backorder than in stock", () => {
    expect(MAX_QUANTITY).toEqual({ in_stock: 5, backorder: 2 });
  });
});
