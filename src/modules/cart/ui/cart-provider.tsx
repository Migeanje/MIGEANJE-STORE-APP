"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import type { CartLine } from "@/modules/cart/domain/cart";
import type { AddToCartResult } from "@/modules/catalog/ui/add-to-cart";
import { AddToCartFeedbackProvider } from "@/modules/catalog/ui/add-to-cart-feedback";
import {
  readCartAction,
  removeLineAction,
  updateQuantityAction,
} from "./actions";
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
  /**
   * The cart with pending changes applied (optimistic); null until the
   * browser has loaded it (the root layout never reads the cart cookie).
   */
  view: CartView | null;
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

const NO_CHANGES: readonly CartChange[] = [];

function appendChange(
  changes: readonly CartChange[],
  change: CartChange,
): readonly CartChange[] {
  return [...changes, change];
}

export type CartProviderProps = {
  /**
   * The cart lines when the server already read the cart (tests, stories).
   * Without them, the provider loads the cart itself with `load`: after the
   * first render, after every navigation (e.g. paying empties the cart) and
   * after every change the server accepted.
   */
  lines?: CartLine[];
  /** Loads this browser's cart lines; `readCartAction` by default. */
  load?: () => Promise<CartLine[]>;
  children: ReactNode;
};

/**
 * Client state of the cart for the whole page: the cart lines with
 * optimistic changes on top (`useOptimistic`: they roll back by themselves
 * when an action fails, and the error is announced), the drawer's open
 * state, and the listener that opens the drawer after "Agregar al carrito".
 */
export function CartProvider({
  lines: serverLines,
  load = readCartAction,
  children,
}: CartProviderProps) {
  const selfLoading = serverLines === undefined;
  const [loadedLines, setLoadedLines] = useState<CartLine[] | null>(null);
  const lines = serverLines ?? loadedLines;
  const [pending, applyChange] = useOptimistic(NO_CHANGES, appendChange);
  const view = useMemo(
    () =>
      lines === null
        ? null
        : toCartView(pending.reduce(applyCartChange, lines)),
    [lines, pending],
  );
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

  // Only the answer to the latest request counts (navigations and changes
  // can overlap).
  const latestLoad = useRef(0);
  const reload = useCallback(async () => {
    if (!selfLoading) return;
    latestLoad.current += 1;
    const request = latestLoad.current;
    try {
      const fresh = await load();
      if (request === latestLoad.current) setLoadedLines(fresh);
    } catch {
      // Keep what is shown; without a cart the header stays a link to
      // /carrito, which reads the cart on the server.
    }
  }, [selfLoading, load]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: every navigation loads the cart again (`pathname` is the trigger).
  useEffect(() => {
    void reload();
  }, [reload, pathname]);

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

  const announceAdded = useCallback(
    (result: AddToCartResult) => {
      // The drawer opens with the cart as the server has it now.
      void reload().then(() => {
        setStatus({ message: result.message, tone: "default" });
        setFocusStatus(true);
        setOpenState(true);
      });
    },
    [reload],
  );

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
          return;
        }
        // Before the optimistic change goes away: no flicker back.
        await reload();
        setStatus(
          announceSuccess ? { message: result.message, tone: "default" } : null,
        );
      });
    },
    [applyChange, reload],
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
