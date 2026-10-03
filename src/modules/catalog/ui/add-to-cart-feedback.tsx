"use client";

import { createContext, type ReactNode, use } from "react";
import type { AddToCartResult } from "./add-to-cart";

/*
 * Second half of the cart extension point (M5): after a successful
 * "Agregar al carrito", the purchase form tells whoever listens (the cart
 * drawer opens and announces it). The cart module provides the listener, so
 * the catalog never imports the cart.
 */

/** Called once per successful add with the action's answer. */
export type AddToCartListener = (result: AddToCartResult) => void;

const AddToCartFeedbackContext = createContext<AddToCartListener | null>(null);

export function AddToCartFeedbackProvider({
  onAdded,
  children,
}: {
  onAdded: AddToCartListener;
  children: ReactNode;
}) {
  return (
    <AddToCartFeedbackContext value={onAdded}>
      {children}
    </AddToCartFeedbackContext>
  );
}

/** The listener, or null when nothing listens (e.g. tests, stories). */
export function useAddToCartFeedback(): AddToCartListener | null {
  return use(AddToCartFeedbackContext);
}
