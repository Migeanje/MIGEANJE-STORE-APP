// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  BACKORDER_15_20,
  buildProduct,
  buildVariant,
} from "@/modules/catalog/testing/catalog-builders";
import type { Product } from "./product";
import {
  defaultVariant,
  variantBySku,
  variantOptions,
} from "./variant-selection";

const UNAVAILABLE = { status: "unavailable" } as const;

const colors = buildProduct({
  options: [{ key: "color", label: "Color" }],
  variants: [
    buildVariant({ sku: "C-WHT", options: { color: "Blanco" } }),
    buildVariant({ sku: "C-BLK", options: { color: "Negro" } }),
  ],
});

// MacBook-like: the chip, memory and storage come bundled in two configs.
const laptop = buildProduct({
  options: [
    { key: "chip", label: "Chip" },
    { key: "memory", label: "Memoria" },
    { key: "color", label: "Color" },
  ],
  variants: [
    buildVariant({
      sku: "L-A-16-SKY",
      options: { chip: "A", memory: "16 GB", color: "Azul" },
      price: 600000,
    }),
    buildVariant({
      sku: "L-A-16-SLV",
      options: { chip: "A", memory: "16 GB", color: "Plata" },
      price: 600000,
    }),
    buildVariant({
      sku: "L-B-24-SKY",
      options: { chip: "B", memory: "24 GB", color: "Azul" },
      price: 800000,
    }),
    buildVariant({
      sku: "L-B-24-SLV",
      options: { chip: "B", memory: "24 GB", color: "Plata" },
      price: 800000,
    }),
  ],
});

function variant(product: Product, sku: string) {
  const found = variantBySku(product, sku);
  if (!found) throw new Error(`No variant ${sku}`);
  return found;
}

describe("defaultVariant", () => {
  it("prefers the best availability, then the lowest price, then catalog order", () => {
    const product = buildProduct({
      options: [{ key: "color", label: "Color" }],
      variants: [
        buildVariant({
          sku: "A",
          options: { color: "Rojo" },
          price: 100,
          availability: UNAVAILABLE,
        }),
        buildVariant({
          sku: "B",
          options: { color: "Azul" },
          price: 300,
          availability: BACKORDER_15_20,
        }),
        buildVariant({ sku: "C", options: { color: "Negro" }, price: 500 }),
        buildVariant({ sku: "D", options: { color: "Gris" }, price: 400 }),
        buildVariant({ sku: "E", options: { color: "Plata" }, price: 400 }),
      ],
    });

    expect(defaultVariant(product).sku).toBe("D");
  });

  it("returns the only variant of a single-variant product", () => {
    expect(defaultVariant(buildProduct()).sku).toBe("TEST-SKU-1");
  });
});

describe("variantBySku", () => {
  it("finds a variant by its exact SKU", () => {
    expect(variantBySku(colors, "C-BLK")?.options).toEqual({ color: "Negro" });
  });

  it("returns undefined for an unknown SKU", () => {
    expect(variantBySku(colors, "c-blk")).toBeUndefined();
    expect(variantBySku(colors, "NOPE")).toBeUndefined();
  });
});

describe("variantOptions", () => {
  it("returns nothing for a product without options", () => {
    expect(variantOptions(buildProduct(), buildVariant())).toEqual([]);
  });

  it("lists every value of each option in first-seen order, marking the selected one", () => {
    const [axis] = variantOptions(colors, variant(colors, "C-BLK"));

    expect(axis?.option).toEqual({ key: "color", label: "Color" });
    expect(axis?.selectedValue).toBe("Negro");
    expect(axis?.choices).toEqual([
      {
        value: "Blanco",
        selected: false,
        variant: variant(colors, "C-WHT"),
      },
      { value: "Negro", selected: true, variant: variant(colors, "C-BLK") },
    ]);
  });

  it("keeps the other selections when the exact combination exists", () => {
    const axes = variantOptions(laptop, variant(laptop, "L-A-16-SKY"));
    const color = axes.find((axis) => axis.option.key === "color");

    expect(
      color?.choices.map((choice) => [choice.value, choice.variant?.sku]),
    ).toEqual([
      ["Azul", "L-A-16-SKY"],
      ["Plata", "L-A-16-SLV"],
    ]);
  });

  it("blocks a value that does not combine with an earlier option, naming that option", () => {
    const axes = variantOptions(laptop, variant(laptop, "L-A-16-SLV"));
    const memory = axes.find((axis) => axis.option.key === "memory");

    expect(memory?.choices[1]).toEqual({
      value: "24 GB",
      selected: false,
      variant: null,
      blockedBy: {
        kind: "combination",
        option: { key: "chip", label: "Chip" },
        value: "A",
      },
    });
  });

  it("never blocks the first option: it leads to the closest variant with that value", () => {
    const axes = variantOptions(laptop, variant(laptop, "L-A-16-SLV"));
    const chip = axes.find((axis) => axis.option.key === "chip");

    // Chip B only comes with 24 GB; the color (Plata) is kept.
    expect(chip?.choices[1]).toEqual({
      value: "B",
      selected: false,
      variant: variant(laptop, "L-B-24-SLV"),
    });
  });

  it("blocks a sold-out value while other variants can be bought", () => {
    const product = buildProduct({
      options: [{ key: "color", label: "Color" }],
      variants: [
        buildVariant({ sku: "S-WHT", options: { color: "Blanco" } }),
        buildVariant({
          sku: "S-BLK",
          options: { color: "Negro" },
          availability: UNAVAILABLE,
        }),
      ],
    });

    const [axis] = variantOptions(product, variant(product, "S-WHT"));

    expect(axis?.choices[1]).toEqual({
      value: "Negro",
      selected: false,
      variant: null,
      blockedBy: { kind: "sold_out" },
    });
  });

  it("keeps a sold-out value selectable when it is the current selection", () => {
    const product = buildProduct({
      options: [{ key: "color", label: "Color" }],
      variants: [
        buildVariant({ sku: "S-WHT", options: { color: "Blanco" } }),
        buildVariant({
          sku: "S-BLK",
          options: { color: "Negro" },
          availability: UNAVAILABLE,
        }),
      ],
    });

    const [axis] = variantOptions(product, variant(product, "S-BLK"));

    expect(axis?.choices[1]).toMatchObject({ value: "Negro", selected: true });
  });

  it("does not block values when nothing can be bought (the whole product is 'Avísame')", () => {
    const product = buildProduct({
      options: [{ key: "color", label: "Color" }],
      variants: [
        buildVariant({
          sku: "U-WHT",
          options: { color: "Blanco" },
          availability: UNAVAILABLE,
        }),
        buildVariant({
          sku: "U-BLK",
          options: { color: "Negro" },
          availability: UNAVAILABLE,
        }),
      ],
    });

    const [axis] = variantOptions(product, variant(product, "U-WHT"));

    expect(axis?.choices[1]).toEqual({
      value: "Negro",
      selected: false,
      variant: variant(product, "U-BLK"),
    });
  });

  it("prefers the candidate that keeps more later selections, then the better availability", () => {
    const product = buildProduct({
      options: [
        { key: "size", label: "Tamaño" },
        { key: "color", label: "Color" },
      ],
      variants: [
        buildVariant({ sku: "P-S-RED", options: { size: "S", color: "Rojo" } }),
        buildVariant({
          sku: "P-M-BLU",
          options: { size: "M", color: "Azul" },
        }),
        buildVariant({
          sku: "P-M-RED",
          options: { size: "M", color: "Rojo" },
          availability: BACKORDER_15_20,
        }),
        buildVariant({
          sku: "P-L-BLU",
          options: { size: "L", color: "Azul" },
          availability: BACKORDER_15_20,
        }),
        buildVariant({
          sku: "P-L-GRN",
          options: { size: "L", color: "Gris" },
        }),
      ],
    });

    const [size] = variantOptions(product, variant(product, "P-S-RED"));

    // M: "Rojo" is kept (even on backorder). L: no "Rojo", so the in-stock one.
    expect(size?.choices.map((choice) => choice.variant?.sku)).toEqual([
      "P-S-RED",
      "P-M-RED",
      "P-L-GRN",
    ]);
  });
});
