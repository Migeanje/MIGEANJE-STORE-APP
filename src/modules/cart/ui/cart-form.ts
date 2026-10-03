import * as z from "zod";
import { skuSchema } from "@/modules/cart/domain/cart";

/** Field names of the cart forms (the same as the purchase form's). */
export const CART_FORM_FIELDS = {
  sku: "sku",
  quantity: "cantidad",
} as const;

/** What every cart action answers; `message` is announced politely. */
export type CartActionResult = { ok: boolean; message: string };

/** A cart server action usable with `useActionState` or called directly. */
export type CartFormAction = (
  previous: CartActionResult | null,
  formData: FormData,
) => Promise<CartActionResult>;

const lineSchema = z.object({ sku: skuSchema });

const quantitySchema = z.object({
  sku: skuSchema,
  // One or two digits: the domain clamps to the line limit afterwards.
  quantity: z
    .string()
    .regex(/^\d{1,2}$/)
    .transform(Number)
    .pipe(z.int().min(1)),
});

/** `sku` + `cantidad` (1 to 99) from a quantity form, or null when invalid. */
export function parseQuantityForm(
  formData: FormData,
): { sku: string; quantity: number } | null {
  const result = quantitySchema.safeParse({
    sku: formData.get(CART_FORM_FIELDS.sku),
    quantity: formData.get(CART_FORM_FIELDS.quantity),
  });
  return result.success ? result.data : null;
}

/** `sku` from a line form (remove), or null when invalid. */
export function parseLineForm(formData: FormData): { sku: string } | null {
  const result = lineSchema.safeParse({
    sku: formData.get(CART_FORM_FIELDS.sku),
  });
  return result.success ? result.data : null;
}

/** Form data for calling a cart action directly (optimistic UI). */
export function cartFormData({
  sku,
  quantity,
}: {
  sku: string;
  quantity?: number;
}): FormData {
  const data = new FormData();
  data.set(CART_FORM_FIELDS.sku, sku);
  if (quantity !== undefined) {
    data.set(CART_FORM_FIELDS.quantity, String(quantity));
  }
  return data;
}
