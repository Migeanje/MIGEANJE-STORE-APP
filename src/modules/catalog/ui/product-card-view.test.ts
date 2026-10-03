// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  BACKORDER_15_20,
  buildProduct,
  buildTestCatalog,
  buildVariant,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import {
  availabilityLabel,
  productCardSpecs,
  toProductCardProps,
} from "./product-card-view";

const [nano, prime, nexode] = buildTestCatalog().products;

describe("availabilityLabel", () => {
  it.each([
    [{ status: "in_stock" } as const, "En stock"],
    [BACKORDER_15_20, "En importación · llega en 15–20 días"],
    [
      { status: "backorder", leadTimeDays: { min: 7, max: 7 } } as const,
      "En importación · llega en 7 días",
    ],
    [
      { status: "backorder", leadTimeDays: { min: 1, max: 1 } } as const,
      "En importación · llega en 1 día",
    ],
    [{ status: "unavailable" } as const, "Agotado"],
  ])("labels %j as %s", (availability, label) => {
    expect(availabilityLabel(availability)).toBe(label);
  });
});

describe("productCardSpecs", () => {
  it("formats up to three short spec values in display order", () => {
    // maxPower, ports (list), technology; the boolean display is skipped.
    expect(productCardSpecs(nano, CHARGERS)).toEqual(["45 W", "USB-C", "GaN"]);
  });

  it("skips unitless numbers, booleans and long texts, and dedupes", () => {
    const product = buildProduct({
      specs: {
        maxPower: 20000,
        technology: "Un texto demasiado largo para una etiqueta",
        display: true,
        weight: 20000,
      },
    });
    const category = {
      ...CHARGERS,
      specSchema: CHARGERS.specSchema.map((definition) =>
        definition.key === "weight"
          ? { ...definition, unit: undefined }
          : definition,
      ),
    };

    expect(productCardSpecs(product, category)).toEqual(["20,000 W"]);
  });

  it("is empty without a category", () => {
    expect(productCardSpecs(nano, undefined)).toEqual([]);
  });
});

describe("toProductCardProps", () => {
  it("maps a product to the card: link, image, brand, price and availability", () => {
    expect(toProductCardProps(nexode, CHARGERS)).toEqual({
      href: "/productos/nexode-65w",
      image: nexode.images[0],
      brand: "UGREEN",
      name: "Nexode Cargador 65W",
      specs: ["65 W", "USB-C", "GaN"],
      price: { amount: 12990, compareAt: 15990 },
      availability: { status: "in_stock", label: "En stock" },
    });
  });

  it("uses the derived price and availability of the variants", () => {
    const props = toProductCardProps(nano, CHARGERS);

    expect(props.price).toEqual({ amount: 24890 });
    // Black arrives in 10 to 12 days: the best variant wins.
    expect(props.availability).toEqual({
      status: "backorder",
      label: "En importación · llega en 10–12 días",
    });
    expect(toProductCardProps(prime, CHARGERS).price).toEqual({
      amount: 18990,
    });
  });

  it("shows the cheapest variant you can buy", () => {
    const product = buildProduct({
      options: [{ key: "color", label: "Color" }],
      variants: [
        buildVariant({ sku: "A", options: { color: "Negro" }, price: 9990 }),
        buildVariant({
          sku: "B",
          options: { color: "Blanco" },
          price: 4990,
          availability: { status: "unavailable" },
        }),
      ],
    });

    expect(toProductCardProps(product, CHARGERS).price).toEqual({
      amount: 9990,
    });
  });
});
