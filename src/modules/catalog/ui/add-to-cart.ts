import * as z from "zod";

/*
 * Extension point for the cart (M5). The product page renders an "Agregar al
 * carrito" form with these fields; the cart module provides a server action
 * of type AddToCartAction and the route passes it to ProductPageContainer as
 * `addToCart`. The form posts to it (progressive enhancement: it works before
 * hydration) and shows the returned message. Without an action the button
 * only says the cart is not ready yet.
 */

/** Form field names of the purchase form. */
export const ADD_TO_CART_FIELDS = {
  sku: "sku",
  quantity: "cantidad",
} as const;

/** The most units any purchase form allows (see MAX_QUANTITY). */
export const ADD_TO_CART_MAX_QUANTITY = 99;

export type AddToCartRequest = { sku: string; quantity: number };

/** What the action answers; `message` is announced politely next to the button. */
export type AddToCartResult = { ok: boolean; message: string };

/** A server action (`"use server"`) usable with React's `useActionState`. */
export type AddToCartAction = (
  previous: AddToCartResult | null,
  formData: FormData,
) => Promise<AddToCartResult>;

const requestSchema = z.object({
  sku: z.string().regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
  quantity: z
    .string()
    .regex(/^\d{1,2}$/)
    .transform(Number)
    .pipe(z.int().min(1).max(ADD_TO_CART_MAX_QUANTITY)),
});

/**
 * Reads a submitted purchase form, or null when it is not a valid request.
 * The cart still checks the SKU, the stock and the per-product maximum.
 */
export function parseAddToCartForm(
  formData: FormData,
): AddToCartRequest | null {
  const result = requestSchema.safeParse({
    sku: formData.get(ADD_TO_CART_FIELDS.sku),
    quantity: formData.get(ADD_TO_CART_FIELDS.quantity),
  });
  return result.success ? result.data : null;
}
