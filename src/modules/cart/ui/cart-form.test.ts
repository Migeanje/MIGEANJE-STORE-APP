// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  CART_FORM_FIELDS,
  cartFormData,
  parseLineForm,
  parseQuantityForm,
} from "./cart-form";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

describe("cart forms", () => {
  it("posts the same fields as the purchase form", () => {
    expect(CART_FORM_FIELDS).toEqual({ sku: "sku", quantity: "cantidad" });
  });

  it("parses a quantity form", () => {
    expect(
      parseQuantityForm(form({ sku: "ANK-A121D-WHT", cantidad: "2" })),
    ).toEqual({ sku: "ANK-A121D-WHT", quantity: 2 });
  });

  it.each<Record<string, string>>([
    { sku: "ank-a2688", cantidad: "2" },
    { sku: "ANK-A2688", cantidad: "0" },
    { sku: "ANK-A2688", cantidad: "100" },
    { sku: "ANK-A2688", cantidad: "1.5" },
    { sku: "ANK-A2688", cantidad: "" },
    { sku: "ANK-A2688" },
  ])("rejects an invalid quantity form %j", (fields) => {
    expect(parseQuantityForm(form(fields))).toBeNull();
  });

  it("parses a line form and rejects a bad SKU", () => {
    expect(parseLineForm(form({ sku: "ANK-A2688" }))).toEqual({
      sku: "ANK-A2688",
    });
    expect(parseLineForm(form({ sku: "<script>" }))).toBeNull();
    expect(parseLineForm(form({}))).toBeNull();
  });

  it("builds form data for direct action calls", () => {
    const data = cartFormData({ sku: "ANK-A2688", quantity: 3 });

    expect(parseQuantityForm(data)).toEqual({ sku: "ANK-A2688", quantity: 3 });
    expect(cartFormData({ sku: "ANK-A2688" }).has("cantidad")).toBe(false);
  });
});
