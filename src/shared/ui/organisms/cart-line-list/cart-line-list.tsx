"use client";

import { Trash2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";
import type { HeadingLevel } from "@/shared/ui/atoms/heading";
import { CartLine, type CartLineData } from "@/shared/ui/molecules/cart-line";
import { QuantityStepper } from "@/shared/ui/molecules/quantity-stepper";

export type CartLineListItem = CartLineData & {
  sku: string;
  /** Name with the variant ("… (Blanco)"): names the line's controls. */
  displayName: string;
  /** Most units allowed (5 in stock, 2 on backorder). */
  maxQuantity: number;
};

export type CartLineListProps = Omit<ComponentProps<"ul">, "children"> & {
  lines: readonly CartLineListItem[];
  /** Outline level of the product names. Defaults to 3. */
  headingLevel?: HeadingLevel;
  /** A committed quantity (buttons, arrows, typing + Enter or blur). */
  onQuantityChange?: (sku: string, quantity: number) => void;
  /** "Quitar" was pressed. Move focus somewhere first: the button goes away. */
  onRemove?: (sku: string) => void;
  /** Called when a product link is followed. */
  onLinkClick?: () => void;
  /**
   * Replaces each line's quantity stepper and "Quitar" button, e.g. with
   * forms that post without JavaScript.
   */
  renderControls?: (line: CartLineListItem) => ReactNode;
};

/**
 * The lines of the cart, each with a controlled quantity stepper ("Cantidad
 * de {producto}", up to its maximum) and a "Quitar" button whose accessible
 * name includes the product. Quantities come from the caller (optimistic
 * state lives in the cart module).
 */
export function CartLineList({
  lines,
  headingLevel = 3,
  onQuantityChange,
  onRemove,
  onLinkClick,
  renderControls,
  className,
  ...props
}: CartLineListProps) {
  return (
    <ul
      {...props}
      className={cn("flex flex-col divide-y divide-border", className)}
    >
      {lines.map((line) => {
        const { sku, displayName, maxQuantity, ...data } = line;
        return (
          <li key={sku} className="py-5 first:pt-0 last:pb-0">
            <CartLine
              {...data}
              headingLevel={headingLevel}
              onLinkClick={onLinkClick}
            >
              {renderControls ? (
                renderControls(line)
              ) : (
                <>
                  <QuantityStepper
                    label={`Cantidad de ${displayName}`}
                    value={line.quantity}
                    max={maxQuantity}
                    onValueChange={(quantity) =>
                      onQuantityChange?.(sku, quantity)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={<Trash2 />}
                    onClick={() => onRemove?.(sku)}
                  >
                    Quitar{" "}
                    <span className="sr-only">{displayName} del carrito</span>
                  </Button>
                </>
              )}
            </CartLine>
          </li>
        );
      })}
    </ul>
  );
}
