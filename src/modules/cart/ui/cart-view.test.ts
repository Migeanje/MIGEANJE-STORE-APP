// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import { applyCartChange, toCartView } from "./cart-view";

const inStock = aLine({ quantity: 2 });
const backorder = aLine({}, aBackorderOffer());

describe("toCartView", () => {
  it("describes an empty cart", () => {
    expect(toCartView([])).toEqual({
      lines: [],
      itemCount: 0,
      itemCountLabel: "0 productos",
      subtotal: 0,
      notes: [],
    });
  });

  it("maps each line to presentational props", () => {
    expect(toCartView([inStock, backorder]).lines).toEqual([
      {
        sku: "ANK-A2688",
        name: "Prime Charger 100W, 3 puertos",
        brand: "Anker",
        variantLabel: undefined,
        displayName: "Prime Charger 100W, 3 puertos",
        href: "/productos/anker-prime-charger-100w-3-puertos",
        image: {
          src: "/mock/products/cargadores.svg",
          width: 640,
          height: 640,
        },
        availability: { status: "in_stock", label: "En stock" },
        unitPrice: 18990,
        lineTotal: 37980,
        quantity: 2,
        maxQuantity: 5,
      },
      expect.objectContaining({
        variantLabel: "Blanco",
        displayName: "Nano Charger 45W Smart Display (Blanco)",
        availability: {
          status: "backorder",
          label: "En importación · llega en 15–20 días",
        },
        lineTotal: 24890,
        maxQuantity: 2,
      }),
    ]);
  });

  it("totals units and céntimos", () => {
    expect(toCartView([inStock, backorder])).toMatchObject({
      itemCount: 3,
      itemCountLabel: "3 productos",
      subtotal: 37980 + 24890,
    });
    expect(toCartView([aLine()]).itemCountLabel).toBe("1 producto");
  });

  it("notes that shipping is calculated at checkout", () => {
    expect(toCartView([inStock]).notes).toEqual([
      "El envío se calcula en el checkout.",
    ]);
  });

  it("explains that a mixed cart ships together when everything arrives", () => {
    expect(toCartView([inStock, backorder]).notes).toEqual([
      "El envío se calcula en el checkout.",
      "Tu pedido incluye productos en importación: lo enviamos completo cuando todo esté disponible, en 15–20 días.",
    ]);
  });

  it("gives the arrival of a backorder-only cart", () => {
    expect(toCartView([backorder]).notes).toEqual([
      "El envío se calcula en el checkout.",
      "Tus productos en importación llegan en 15–20 días; te avisamos en cada paso.",
    ]);
  });
});

describe("applyCartChange", () => {
  it("sets a line quantity within 1 and its maximum", () => {
    expect(
      applyCartChange([inStock], {
        kind: "quantity",
        sku: "ANK-A2688",
        quantity: 4,
      }),
    ).toEqual([aLine({ quantity: 4 })]);
    expect(
      applyCartChange([inStock], {
        kind: "quantity",
        sku: "ANK-A2688",
        quantity: 9,
      }),
    ).toEqual([aLine({ quantity: 5 })]);
    expect(
      applyCartChange([inStock], {
        kind: "quantity",
        sku: "ANK-A2688",
        quantity: 0,
      }),
    ).toEqual([aLine({ quantity: 1 })]);
  });

  it("removes a line", () => {
    expect(
      applyCartChange([inStock, backorder], {
        kind: "remove",
        sku: "ANK-A2688",
      }),
    ).toEqual([backorder]);
  });

  it("ignores a SKU that is not in the cart", () => {
    const lines = [inStock];

    expect(
      applyCartChange(lines, { kind: "quantity", sku: "NOPE-1", quantity: 2 }),
    ).toEqual(lines);
    expect(applyCartChange(lines, { kind: "remove", sku: "NOPE-1" })).toEqual(
      lines,
    );
  });
});
