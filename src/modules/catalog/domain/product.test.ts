// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  BACKORDER_15_20,
  buildProduct,
  buildVariant,
} from "@/modules/catalog/testing/catalog-builders";
import type { ExpertReview } from "./expert-review";
import {
  type Product,
  productAvailability,
  productPrice,
  productSchema,
} from "./product";

const COLOR = [{ key: "color", label: "Color" }];

const REVIEW: ExpertReview = {
  verdict: "Compacto y rápido para tu iPhone.",
  forWhom: ["Viajas seguido"],
  notFor: ["Necesitas cargar un laptop"],
  rubric: [
    { criterion: "Potencia", score: 4, note: "Suficiente para un celular." },
  ],
};

function issuesOf(product: unknown): string[] {
  const result = productSchema.safeParse(product);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
}

describe("productSchema", () => {
  it("accepts a product with variants and an expert review", () => {
    const product = buildProduct({
      model: "A121D",
      options: COLOR,
      variants: [
        buildVariant({ sku: "A-WHT", options: { color: "Blanco" } }),
        buildVariant({ sku: "A-BLK", options: { color: "Negro" } }),
      ],
      expertReview: REVIEW,
      tags: ["gan"],
    });

    expect(productSchema.parse(product)).toEqual(product);
  });

  it("requires at least one variant and one image", () => {
    expect(issuesOf(buildProduct({ variants: [] }))).not.toEqual([]);
    expect(issuesOf(buildProduct({ images: [] }))).not.toEqual([]);
  });

  it("rejects unknown keys (fixtures are typo-checked)", () => {
    expect(
      issuesOf({ ...buildProduct(), sumary: "Typo in summary" }),
    ).not.toEqual([]);
  });

  it("requires compareAt to be above the price", () => {
    const product = buildProduct({
      variants: [buildVariant({ price: 9990, compareAt: 9990 })],
    });

    expect(issuesOf(product)).toContain("compareAt must be above the price");
  });

  it("names a repeated SKU", () => {
    const product = buildProduct({
      options: COLOR,
      variants: [
        buildVariant({ sku: "A-1", options: { color: "Blanco" } }),
        buildVariant({ sku: "A-1", options: { color: "Negro" } }),
      ],
    });

    expect(issuesOf(product)).toContain('SKU "A-1" is used twice');
  });

  it("requires every variant to set exactly the product options", () => {
    const missing = buildProduct({
      options: COLOR,
      variants: [buildVariant({ options: {} })],
    });
    const extra = buildProduct({
      variants: [buildVariant({ options: { color: "Negro" } })],
    });

    expect(issuesOf(missing)).toContain(
      'Variant "TEST-SKU-1" must set exactly the options: color',
    );
    expect(issuesOf(extra)).toContain(
      'Variant "TEST-SKU-1" must set exactly the options: (none)',
    );
  });

  it("names a repeated option combination", () => {
    const product = buildProduct({
      options: COLOR,
      variants: [
        buildVariant({ sku: "A-1", options: { color: "Negro" } }),
        buildVariant({ sku: "A-2", options: { color: "Negro" } }),
      ],
    });

    expect(issuesOf(product)).toContain(
      'Variants "A-1" and "A-2" have the same options',
    );
  });

  it("validates the expert review rubric", () => {
    const score = (value: number) =>
      buildProduct({
        expertReview: {
          ...REVIEW,
          rubric: [{ ...REVIEW.rubric[0], score: value }],
        },
      });

    expect(issuesOf(score(0))).not.toEqual([]);
    expect(issuesOf(score(6))).not.toEqual([]);
    expect(issuesOf(score(3.5))).not.toEqual([]);
    expect(
      issuesOf(buildProduct({ expertReview: { ...REVIEW, forWhom: [] } })),
    ).not.toEqual([]);
    expect(
      issuesOf(
        buildProduct({
          expertReview: {
            ...REVIEW,
            rubric: [REVIEW.rubric[0], REVIEW.rubric[0]],
          },
        }),
      ),
    ).toContain('Rubric criterion "Potencia" is used twice');
  });
});

describe("productPrice", () => {
  function withVariants(...variants: Product["variants"]): Product {
    return buildProduct({
      options: COLOR,
      variants: variants.map((variant, index) => ({
        ...variant,
        sku: `SKU-${index}`,
        options: { color: `Color ${index}` },
      })),
    });
  }

  it("is the variant price for a single variant, with its compareAt", () => {
    expect(
      productPrice(
        withVariants(buildVariant({ price: 12990, compareAt: 15990 })),
      ),
    ).toEqual({ from: 12990, to: 12990, compareAt: 15990 });
  });

  it("goes from the cheapest to the most expensive variant", () => {
    expect(
      productPrice(
        withVariants(
          buildVariant({ price: 649890 }),
          buildVariant({ price: 549890 }),
          buildVariant({ price: 899890 }),
        ),
      ),
    ).toEqual({ from: 549890, to: 899890 });
  });

  it("only counts variants you can buy", () => {
    expect(
      productPrice(
        withVariants(
          buildVariant({
            price: 9990,
            availability: { status: "unavailable" },
          }),
          buildVariant({ price: 12990, availability: BACKORDER_15_20 }),
          buildVariant({ price: 14990 }),
        ),
      ),
    ).toEqual({ from: 12990, to: 14990 });
  });

  it("falls back to every variant when none can be bought", () => {
    const unavailable = { status: "unavailable" } as const;

    expect(
      productPrice(
        withVariants(
          buildVariant({ price: 9990, availability: unavailable }),
          buildVariant({ price: 12990, availability: unavailable }),
        ),
      ),
    ).toEqual({ from: 9990, to: 12990 });
  });

  it("takes compareAt only from the variant that sets the from price", () => {
    expect(
      productPrice(
        withVariants(
          buildVariant({ price: 9990 }),
          buildVariant({ price: 12990, compareAt: 15990 }),
        ),
      ),
    ).toEqual({ from: 9990, to: 12990 });
  });
});

describe("productAvailability", () => {
  it("is the best availability across the variants", () => {
    const product = buildProduct({
      options: COLOR,
      variants: [
        buildVariant({
          sku: "A",
          options: { color: "Blanco" },
          availability: { status: "unavailable" },
        }),
        buildVariant({
          sku: "B",
          options: { color: "Negro" },
          availability: BACKORDER_15_20,
        }),
      ],
    });

    expect(productAvailability(product)).toEqual(BACKORDER_15_20);
  });
});
