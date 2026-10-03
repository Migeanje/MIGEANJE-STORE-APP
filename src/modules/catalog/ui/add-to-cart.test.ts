// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ADD_TO_CART_FIELDS, parseAddToCartForm } from "./add-to-cart";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("parseAddToCartForm", () => {
  it("reads the SKU and the quantity of the product form", () => {
    expect(
      parseAddToCartForm(
        form({
          [ADD_TO_CART_FIELDS.sku]: "ANK-A2688",
          [ADD_TO_CART_FIELDS.quantity]: "2",
        }),
      ),
    ).toEqual({ sku: "ANK-A2688", quantity: 2 });
  });

  it.each([
    [{ sku: "ank-a2688", cantidad: "1" }],
    [{ sku: "ANK-A2688", cantidad: "0" }],
    [{ sku: "ANK-A2688", cantidad: "1.5" }],
    [{ sku: "ANK-A2688", cantidad: "100" }],
    [{ sku: "ANK-A2688" }],
    [{ cantidad: "1" }],
  ])("rejects an invalid submission: %j", (entries) => {
    expect(parseAddToCartForm(form(entries))).toBeNull();
  });
});
