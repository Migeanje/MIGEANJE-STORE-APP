"use client";

import { ShoppingCart } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/shared/ui/atoms/button";
import { QuantityStepper } from "@/shared/ui/molecules/quantity-stepper";
import {
  ADD_TO_CART_FIELDS,
  type AddToCartAction,
  type AddToCartResult,
} from "./add-to-cart";

// DRAFT: copy pending owner review. Shown until the cart (M5) is connected.
const CART_NOT_READY: AddToCartResult = {
  ok: false,
  message: "El carrito llega muy pronto: todavía no puedes agregar productos.",
};

async function cartNotReady(): Promise<AddToCartResult> {
  return CART_NOT_READY;
}

export type PurchaseFormProps = {
  /** The selected variant. */
  sku: string;
  /** Most units allowed for this availability (see MAX_QUANTITY). */
  maxQuantity: number;
  /** The cart's server action (M5). Without it the button says the cart is not ready. */
  action?: AddToCartAction;
};

/**
 * Quantity + "Agregar al carrito" for the selected variant. A form posting
 * `sku` and `cantidad` to the cart's server action (so it works before
 * hydration), with its answer announced politely below the button.
 */
export function PurchaseForm({ sku, maxQuantity, action }: PurchaseFormProps) {
  const [result, formAction, pending] = useActionState<
    AddToCartResult | null,
    FormData
  >(action ?? cartNotReady, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name={ADD_TO_CART_FIELDS.sku} value={sku} />
      {/* A new variant (or maximum) starts again from one unit. */}
      <QuantityStepper
        key={`${sku}-${maxQuantity}`}
        label="Cantidad"
        name={ADD_TO_CART_FIELDS.quantity}
        max={maxQuantity}
        className="self-start"
      />
      <Button
        type="submit"
        size="lg"
        loading={pending}
        leadingIcon={<ShoppingCart />}
      >
        Agregar al carrito
      </Button>
      {/* Always rendered, so screen readers notice when the message changes. */}
      <p
        role="status"
        className={
          result?.ok
            ? "text-body-sm text-foreground"
            : "text-body-sm text-muted-foreground"
        }
      >
        {result?.message}
      </p>
    </form>
  );
}
