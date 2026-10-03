// @vitest-environment node
import { describe, expect, it } from "vitest";
import { cartLineProductSchema } from "@/modules/cart/domain/cart";
import { createMockCatalogRepository } from "@/modules/catalog/infrastructure/catalog.mock";
import { createCatalogProductLookup } from "./catalog-product-lookup";

const lookup = createCatalogProductLookup(createMockCatalogRepository());

describe("createCatalogProductLookup", () => {
  it("maps an in-stock variant without options", async () => {
    expect(await lookup.findOffer("ANK-A2688")).toEqual({
      sku: "ANK-A2688",
      unitPrice: 18990,
      availability: { status: "in_stock" },
      product: {
        name: "Prime Charger 100W, 3 puertos",
        brand: "Anker",
        variantLabel: "",
        href: "/productos/anker-prime-charger-100w-3-puertos?variante=ank-a2688",
        image: {
          src: "/mock/products/cargadores.svg",
          width: 640,
          height: 640,
        },
      },
    });
  });

  it("maps a backorder variant with its option values and lead time", async () => {
    const offer = await lookup.findOffer("ANK-A121D-WHT");

    expect(offer).toMatchObject({
      sku: "ANK-A121D-WHT",
      unitPrice: 24890,
      availability: { status: "backorder", leadTimeDays: { min: 15, max: 20 } },
      product: {
        name: "Nano Charger 45W Smart Display",
        variantLabel: "Blanco",
        href: "/productos/anker-nano-charger-45w-smart-display?variante=ank-a121d-wht",
      },
    });
  });

  it("reports an unavailable variant as unavailable", async () => {
    expect(await lookup.findOffer("APL-MFHP4")).toMatchObject({
      availability: { status: "unavailable" },
    });
  });

  it("answers null for an unknown SKU", async () => {
    expect(await lookup.findOffer("NOPE-1")).toBeNull();
  });

  it("returns plain copies that the cart may keep (not the frozen catalog data)", async () => {
    const offer = await lookup.findOffer("ANK-A121D-WHT");

    expect(Object.isFrozen(offer?.availability)).toBe(false);
    expect(cartLineProductSchema.safeParse(offer?.product).success).toBe(true);
  });
});
