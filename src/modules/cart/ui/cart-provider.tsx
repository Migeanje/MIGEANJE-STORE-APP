"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import type { CartLine } from "@/modules/cart/domain/cart";
import type { AddToCartResult } from "@/modules/catalog/ui/add-to-cart";
import { AddToCartFeedbackProvider } from "@/modules/catalog/ui/add-to-cart-feedback";
import { removeLineAction, updateQuantityAction } from "./actions";
import { CART_FAILURE_MESSAGE } from "./cart-copy";
import {
  type CartActionResult,
  type CartFormAction,
  cartFormData,
} from "./cart-form";
import {
  applyCartChange,
  type CartChange,
  type CartView,
  toCartView,
} from "./cart-view";

export type CartStatus = { message: string; tone: "default" | "error" };

export type CartContextValue = {
  /** The cart with pending changes applied (optimistic). */
  view: CartView;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Opens the drawer from the header button. */
  openCart: () => void;
  /** Latest announcement: an add, a removal or an error. */
  status: CartStatus | null;
  /** The drawer opened after an add: focus the status first. */
  focusStatus: boolean;
  changeQuantity: (sku: string, quantity: number) => void;
  removeLine: (sku: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** The cart state. Throws outside a CartProvider (see CartRoot). */
export function useCart(): CartContextValue {
  const value = use(CartContext);
  if (!value) throw new Error("useCart must be used inside a CartProvider");
  return value;
}

/**
 * Client state of the cart for the whole page: the server's lines (from the
 * cookie, re-rendered by `refresh()` after every action) with optimistic
 * changes on top (`useOptimistic`: they roll back by themselves when an
 * action fails, and the error is announced), the drawer's open state, and
 * the listener that opens the drawer after "Agregar al carrito".
 */
export function CartProvider({
  lines,
  children,
}: {
  lines: CartLine[];
  children: ReactNode;
}) {
  const [optimisticLines, applyChange] = useOptimistic(lines, applyCartChange);
  const view = useMemo(() => toCartView(optimisticLines), [optimisticLines]);
  const [open, setOpenState] = useState(false);
  const [status, setStatus] = useState<CartStatus | null>(null);
  const [focusStatus, setFocusStatus] = useState(false);
  const [, startTransition] = useTransition();

  // A navigation (a link in the drawer, back/forward) closes the drawer.
  const pathname = usePathname();
  const [shownPathname, setShownPathname] = useState(pathname);
  if (pathname !== shownPathname) {
    setShownPathname(pathname);
    setOpenState(false);
  }

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    if (!next) {
      setStatus(null);
      setFocusStatus(false);
    }
  }, []);

  const openCart = useCallback(() => {
    setStatus(null);
    setFocusStatus(false);
    setOpenState(true);
  }, []);

  const announceAdded = useCallback((result: AddToCartResult) => {
    setStatus({ message: result.message, tone: "default" });
    setFocusStatus(true);
    setOpenState(true);
  }, []);

  const mutate = useCallback(
    (
      change: CartChange,
      action: CartFormAction,
      formData: FormData,
      announceSuccess: boolean,
    ) => {
      startTransition(async () => {
        applyChange(change);
        let result: CartActionResult;
        try {
          result = await action(null, formData);
        } catch {
          result = { ok: false, message: CART_FAILURE_MESSAGE };
        }
        if (!result.ok) {
          setStatus({ message: result.message, tone: "error" });
        } else {
          setStatus(
            announceSuccess
              ? { message: result.message, tone: "default" }
              : null,
          );
        }
      });
    },
    [applyChange],
  );

  const changeQuantity = useCallback(
    (sku: string, quantity: number) =>
      mutate(
        { kind: "quantity", sku, quantity },
        updateQuantityAction,
        cartFormData({ sku, quantity }),
        false,
      ),
    [mutate],
  );

  const removeLine = useCallback(
    (sku: string) =>
      mutate(
        { kind: "remove", sku },
        removeLineAction,
        cartFormData({ sku }),
        true,
      ),
    [mutate],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      view,
      open,
      setOpen,
      openCart,
      status,
      focusStatus,
      changeQuantity,
      removeLine,
    }),
    [
      view,
      open,
      setOpen,
      openCart,
      status,
      focusStatus,
      changeQuantity,
      removeLine,
    ],
  );

  return (
    <CartContext value={value}>
      <AddToCartFeedbackProvider onAdded={announceAdded}>
        {children}
      </AddToCartFeedbackProvider>
    </CartContext>
  );
}
