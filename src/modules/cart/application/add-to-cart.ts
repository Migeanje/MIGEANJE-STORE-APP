import {
  addLine,
  type Cart,
  type CartLine,
  type CartLineProduct,
  type QuantityClamp,
  type QuantityLimit,
} from "@/modules/cart/domain/cart";
import type { CartServices } from "./ports";

export type AddToCartRequest = { sku: string; quantity: number };

export type AddToCartError =
  | { code: "unknown_sku" }
  | { code: "unavailable"; product: CartLineProduct }
  | {
      code: "limit_reached";
      product: CartLineProduct;
      limit: QuantityLimit;
      /** Units already in the cart. */
      quantity: number;
    };

export type AddToCartOutcome =
  | {
      ok: true;
      cart: Cart;
      line: CartLine;
      added: number;
      clamped: QuantityClamp | null;
    }
  | { ok: false; error: AddToCartError };

/**
 * Adds units of a SKU to the cart of `cartId`, creating a cart when there is
 * none (or it no longer exists). Price and availability always come from the
 * catalog (ProductLookup), never from the request. Unknown and unavailable
 * SKUs are refused before any cart is created.
 */
export async function addToCart(
  { carts, products }: CartServices,
  cartId: string | undefined,
  { sku, quantity }: AddToCartRequest,
): Promise<AddToCartOutcome> {
  const offer = await products.findOffer(sku);
  if (!offer) return { ok: false, error: { code: "unknown_sku" } };
  if (offer.availability.status === "unavailable") {
    return {
      ok: false,
      error: { code: "unavailable", product: offer.product },
    };
  }

  const cart =
    (cartId === undefined ? null : await carts.get(cartId)) ??
    (await carts.create());
  const result = addLine(cart, offer, quantity);
  if (!result.ok) {
    return result.reason === "unavailable"
      ? { ok: false, error: { code: "unavailable", product: offer.product } }
      : {
          ok: false,
          error: {
            code: "limit_reached",
            product: offer.product,
            limit: result.limit,
            quantity: result.line.quantity,
          },
        };
  }

  await carts.save(result.cart);
  return {
    ok: true,
    cart: result.cart,
    line: result.line,
    added: result.added,
    clamped: result.clamped,
  };
}
