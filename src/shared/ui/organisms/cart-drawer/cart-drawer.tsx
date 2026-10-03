"use client";

import { type MouseEvent, type ReactNode, useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";
import { CartSummary } from "@/shared/ui/molecules/cart-summary";
import { EmptyState } from "@/shared/ui/molecules/empty-state";
import {
  CartLineList,
  type CartLineListItem,
} from "@/shared/ui/organisms/cart-line-list";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/primitives/sheet";

export type CartDrawerStatus = {
  message: string;
  /** `error` for a failed change (the quantity was rolled back). */
  tone?: "default" | "error";
};

export type CartDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: readonly CartLineListItem[];
  /** "3 productos". */
  itemCountLabel: string;
  /** In céntimos. */
  subtotal: number;
  /** Under the subtotal: shipping, how a backorder ships. */
  notes?: readonly string[];
  /** Announced politely, e.g. "Agregaste … al carrito" or an error. */
  status?: CartDrawerStatus | null;
  /**
   * Move focus to the status when the drawer opens (after "Agregar al
   * carrito"), so it is read first. Otherwise Radix focuses the first control.
   */
  focusStatusOnOpen?: boolean;
  /** Where "Ir a pagar" goes. Defaults to /checkout. */
  checkoutHref?: string;
  /** Extra content for the empty cart, e.g. category links. */
  emptyState?: ReactNode;
  onQuantityChange: (sku: string, quantity: number) => void;
  onRemove: (sku: string) => void;
};

/**
 * The cart drawer: a right-side sheet (focus trap, Escape and focus return
 * from Radix; `data-lenis-prevent` from the Sheet) titled "Tu carrito". It
 * lists the lines with their steppers and "Quitar", and a footer with the
 * subtotal, notes, "Ir a pagar" and "Seguir comprando" (closes it). Empty, it
 * says so and shows `emptyState`. A polite status region announces changes;
 * before a line is removed, focus moves to it so it never falls to the page.
 * Following any link inside closes the drawer.
 */
export function CartDrawer({
  open,
  onOpenChange,
  lines,
  itemCountLabel,
  subtotal,
  notes = [],
  status,
  focusStatusOnOpen = false,
  checkoutHref = "/checkout",
  emptyState,
  onQuantityChange,
  onRemove,
}: CartDrawerProps) {
  const statusRef = useRef<HTMLParagraphElement>(null);
  const isEmpty = lines.length === 0;

  function closeOnLink(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("a[href]")) {
      onOpenChange(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel="Cerrar carrito"
        // The whole panel scrolls (the Sheet sets overflow-y-auto), so short
        // landscape screens can always reach every line and the footer.
        className="w-full max-w-md gap-0 p-0"
        onClickCapture={closeOnLink}
        onOpenAutoFocus={(event) => {
          if (focusStatusOnOpen && statusRef.current) {
            event.preventDefault();
            statusRef.current.focus();
          }
        }}
        {...(isEmpty ? { "aria-describedby": undefined } : {})}
      >
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Tu carrito</SheetTitle>
          {isEmpty ? null : (
            <SheetDescription>{itemCountLabel}</SheetDescription>
          )}
          {/* Always rendered so screen readers notice when it changes. */}
          <p
            ref={statusRef}
            role="status"
            tabIndex={-1}
            className={cn(
              "text-body-sm outline-none",
              status?.tone === "error" ? "text-destructive" : "text-foreground",
            )}
          >
            {status?.message}
          </p>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex flex-col gap-8 px-6 pb-6">
            <EmptyState
              title="Tu carrito está vacío"
              description="Explora nuestras categorías y encuentra lo que tu equipo necesita."
              headingLevel={3}
            />
            {emptyState}
          </div>
        ) : (
          <>
            <div className="px-6 pb-6">
              <CartLineList
                lines={lines}
                onQuantityChange={onQuantityChange}
                onRemove={(sku) => {
                  // The "Quitar" button is about to disappear.
                  statusRef.current?.focus();
                  onRemove(sku);
                }}
              />
            </div>
            <CartSummary
              // Pinned to the bottom on tall screens; scrolls with the lines
              // on short ones so it never hides them.
              className="mt-auto border-t border-border bg-card p-6 [@media(min-height:40rem)]:sticky [@media(min-height:40rem)]:bottom-0"
              subtotal={subtotal}
              itemCountLabel={itemCountLabel}
              notes={notes}
              checkoutHref={checkoutHref}
              secondaryAction={
                <SheetClose asChild>
                  <Button variant="secondary" size="lg">
                    Seguir comprando
                  </Button>
                </SheetClose>
              }
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
