"use client";

import Link from "next/link";
import { type ReactNode, useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import { CartSummary } from "@/shared/ui/molecules/cart-summary";
import { EmptyState } from "@/shared/ui/molecules/empty-state";
import { CartLineList } from "@/shared/ui/organisms/cart-line-list";
import { CartLineForms } from "./cart-line-forms";
import { CHECKOUT_PATH } from "./cart-paths";
import { useCart } from "./cart-provider";

const LINES_HEADING_ID = "carrito-productos";

/**
 * The cart page (/carrito): the drawer's content as a full page, for deep
 * links and visits without JavaScript. The server HTML has forms that post to
 * the cart's server actions; once hydrated they become the same optimistic
 * controls as the drawer. Empty, it offers `emptyState` (category links).
 */
export function CartPageContainer({ emptyState }: { emptyState?: ReactNode }) {
  const { view, status, changeQuantity, removeLine } = useCart();
  const hydrated = useHydrated();
  const statusRef = useRef<HTMLParagraphElement>(null);
  const isEmpty = view.lines.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-2">
        <Heading level={1} size="display-l">
          Tu carrito
        </Heading>
        {isEmpty ? null : <Text tone="muted">{view.itemCountLabel}</Text>}
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
      </div>

      {isEmpty ? (
        <div className="flex flex-col gap-10">
          <EmptyState
            title="Tu carrito está vacío"
            description="Explora nuestras categorías y encuentra lo que tu equipo necesita."
          >
            <Button asChild>
              <Link href="/">Ir al inicio</Link>
            </Button>
          </EmptyState>
          {emptyState}
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <section aria-labelledby={LINES_HEADING_ID}>
            <h2 id={LINES_HEADING_ID} className="sr-only">
              Productos
            </h2>
            <CartLineList
              lines={view.lines}
              onQuantityChange={changeQuantity}
              onRemove={(sku) => {
                // The "Quitar" button is about to disappear.
                statusRef.current?.focus();
                removeLine(sku);
              }}
              renderControls={
                hydrated ? undefined : (line) => <CartLineForms line={line} />
              }
            />
          </section>
          <CartSummary
            title="Resumen"
            className="rounded-lg border bg-card p-6 lg:sticky lg:top-24"
            subtotal={view.subtotal}
            itemCountLabel={view.itemCountLabel}
            notes={view.notes}
            checkoutHref={CHECKOUT_PATH}
            secondaryAction={
              <Button asChild variant="secondary" size="lg">
                <Link href="/">Seguir comprando</Link>
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
