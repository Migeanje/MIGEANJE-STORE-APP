import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  AvailabilityIndicator,
  type AvailabilityStatus,
} from "@/shared/ui/atoms/availability-indicator";
import { Price } from "@/shared/ui/atoms/price";
import { Text } from "@/shared/ui/atoms/text";

export type PurchasePanelProps = Omit<ComponentProps<"div">, "children"> & {
  /** In céntimos (integer minor units), see `Price`. */
  price: { amount: number; compareAt?: number };
  availability: { status: AvailabilityStatus; label: string };
  /** An explainer under the availability, e.g. how a backorder works. */
  note?: ReactNode;
  /** The variant's SKU, shown as data (Geist Mono). */
  sku?: string;
  /** The actions: quantity + "Agregar al carrito", or "Avísame". */
  children?: ReactNode;
};

/**
 * The buy box of the product page: price (with the previous price struck
 * through), availability LED, an optional explainer and the actions. The page
 * template makes it sticky from `lg`.
 */
export function PurchasePanel({
  price,
  availability,
  note,
  sku,
  children,
  className,
  ...props
}: PurchasePanelProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-col gap-5 rounded-lg border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <Price amount={price.amount} compareAt={price.compareAt} size="lg" />
        <AvailabilityIndicator status={availability.status}>
          {availability.label}
        </AvailabilityIndicator>
        {note ? (
          <Text
            size="body-sm"
            tone="muted"
            className="rounded-md bg-surface-raised px-4 py-3 text-pretty"
          >
            {note}
          </Text>
        ) : null}
      </div>
      {children}
      {sku ? (
        <Text mono size="caption" tone="muted">
          SKU {sku}
        </Text>
      ) : null}
    </div>
  );
}
