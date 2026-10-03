"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/shared/ui/atoms/button";
import { QuantityStepper } from "@/shared/ui/molecules/quantity-stepper";
import type { CartLineListItem } from "@/shared/ui/organisms/cart-line-list";
import { removeLineAction, updateQuantityAction } from "./actions";
import { CART_FORM_FIELDS, type CartActionResult } from "./cart-form";

/**
 * The controls of one cart page line before (or without) JavaScript: forms
 * that post to the cart's server actions (`useActionState` keeps their answer
 * across the full-page post). Type a quantity and press "Actualizar", or
 * "Quitar". Once hydrated, the page swaps them for the optimistic controls.
 */
export function CartLineForms({ line }: { line: CartLineListItem }) {
  const [updated, updateAction, updating] = useActionState<
    CartActionResult | null,
    FormData
  >(updateQuantityAction, null);
  const [removed, removeAction, removing] = useActionState<
    CartActionResult | null,
    FormData
  >(removeLineAction, null);
  const answer = removed ?? updated;

  return (
    <>
      <form action={updateAction} className="flex items-center gap-2">
        <input type="hidden" name={CART_FORM_FIELDS.sku} value={line.sku} />
        <QuantityStepper
          label={`Cantidad de ${line.displayName}`}
          name={CART_FORM_FIELDS.quantity}
          defaultValue={line.quantity}
          max={line.maxQuantity}
        />
        <Button type="submit" variant="secondary" size="sm" loading={updating}>
          Actualizar{" "}
          <span className="sr-only">la cantidad de {line.displayName}</span>
        </Button>
      </form>
      <form action={removeAction}>
        <input type="hidden" name={CART_FORM_FIELDS.sku} value={line.sku} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          leadingIcon={<Trash2 />}
          loading={removing}
        >
          Quitar <span className="sr-only">{line.displayName} del carrito</span>
        </Button>
      </form>
      <p
        role="status"
        className={
          answer?.ok === false
            ? "w-full text-body-sm text-destructive"
            : "w-full text-body-sm text-foreground"
        }
      >
        {answer?.message}
      </p>
    </>
  );
}
