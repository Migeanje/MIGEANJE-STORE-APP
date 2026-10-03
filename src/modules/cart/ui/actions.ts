"use server";

import { refresh } from "next/cache";
import { addToCart } from "@/modules/cart/application/add-to-cart";
import { getCart } from "@/modules/cart/application/get-cart";
import { removeLine } from "@/modules/cart/application/remove-line";
import { updateLineQuantity } from "@/modules/cart/application/update-line-quantity";
import type { CartLine } from "@/modules/cart/domain/cart";
import {
  getCartRepository,
  getCartServices,
} from "@/modules/cart/infrastructure";
import {
  readCartId,
  writeCartId,
} from "@/modules/cart/infrastructure/cart-cookie";
import {
  type AddToCartResult,
  parseAddToCartForm,
} from "@/modules/catalog/ui/add-to-cart";
import {
  addErrorMessage,
  addedMessage,
  CART_FAILURE_MESSAGE,
  INVALID_PRODUCT_MESSAGE,
  INVALID_QUANTITY_MESSAGE,
  removedMessage,
  updatedMessage,
  updateErrorMessage,
} from "./cart-copy";
import {
  type CartActionResult,
  parseLineForm,
  parseQuantityForm,
} from "./cart-form";

/*
 * Cart server actions. Each one reads the cart id from the httpOnly cookie,
 * runs a use case (price and availability come from the catalog, never from
 * the form), renews the cookie and calls `refresh()` so the same response
 * carries the re-rendered page (e.g. /carrito without JavaScript); the
 * header count and the drawer load the cart again (`readCartAction`). They answer
 * `{ ok, message }` for `useActionState` (forms work before hydration and
 * without JavaScript) and for direct calls from the optimistic drawer.
 */

/**
 * The lines of this browser's cart (empty without one), for the header count
 * and the drawer: the root layout never reads the cart cookie, so pages stay
 * static and the browser asks for the cart after loading (and after every
 * navigation or change). Read-only: it never creates a cart or a cookie.
 */
export async function readCartAction(): Promise<CartLine[]> {
  const cart = await getCart(getCartRepository(), await readCartId());
  return cart?.lines ?? [];
}

function failed(error: unknown): CartActionResult {
  console.error("Cart action failed", error);
  return { ok: false, message: CART_FAILURE_MESSAGE };
}

/**
 * "Agregar al carrito" of the product page (the catalog's `AddToCartAction`
 * extension point): fields `sku` and `cantidad`.
 */
export async function addToCartAction(
  _previous: AddToCartResult | null,
  formData: FormData,
): Promise<AddToCartResult> {
  const request = parseAddToCartForm(formData);
  if (!request) return { ok: false, message: INVALID_PRODUCT_MESSAGE };
  try {
    const outcome = await addToCart(
      getCartServices(),
      await readCartId(),
      request,
    );
    if (!outcome.ok) {
      return { ok: false, message: addErrorMessage(outcome.error) };
    }
    await writeCartId(outcome.cart.id);
    refresh();
    return { ok: true, message: addedMessage(outcome) };
  } catch (error) {
    return failed(error);
  }
}

/** Sets the units of a line: fields `sku` and `cantidad`. */
export async function updateQuantityAction(
  _previous: CartActionResult | null,
  formData: FormData,
): Promise<CartActionResult> {
  const request = parseQuantityForm(formData);
  if (!request) return { ok: false, message: INVALID_QUANTITY_MESSAGE };
  try {
    const outcome = await updateLineQuantity(
      getCartServices(),
      await readCartId(),
      request,
    );
    if (!outcome.ok) {
      // The page showed a line the cart no longer has: show the real cart.
      if (outcome.error.code === "not_in_cart") refresh();
      return { ok: false, message: updateErrorMessage(outcome.error) };
    }
    await writeCartId(outcome.cart.id);
    refresh();
    return { ok: true, message: updatedMessage(outcome) };
  } catch (error) {
    return failed(error);
  }
}

/** Removes a line: field `sku`. Removing what is already gone is fine. */
export async function removeLineAction(
  _previous: CartActionResult | null,
  formData: FormData,
): Promise<CartActionResult> {
  const request = parseLineForm(formData);
  if (!request) return { ok: false, message: INVALID_PRODUCT_MESSAGE };
  try {
    const { removed } = await removeLine(
      getCartRepository(),
      await readCartId(),
      request.sku,
    );
    refresh();
    return { ok: true, message: removedMessage(removed) };
  } catch (error) {
    return failed(error);
  }
}
