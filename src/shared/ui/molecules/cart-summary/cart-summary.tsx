import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";
import { Heading, type HeadingLevel } from "@/shared/ui/atoms/heading";
import { Price } from "@/shared/ui/atoms/price";
import { Text } from "@/shared/ui/atoms/text";

export type CartSummaryProps = Omit<ComponentProps<"div">, "children"> & {
  /** Sum of the lines, in céntimos. */
  subtotal: number;
  /** "3 productos". */
  itemCountLabel: string;
  /** Notes under the subtotal: shipping, how a backorder ships. */
  notes?: readonly string[];
  /** Where "Ir a pagar" goes. */
  checkoutHref: string;
  /** Under the CTA, e.g. "Seguir comprando" (a link, or a button closing a drawer). */
  secondaryAction?: ReactNode;
  /** Optional heading, e.g. "Resumen" on the cart page. */
  title?: string;
  /** Outline level of `title`. Defaults to 2. */
  headingLevel?: HeadingLevel;
};

/**
 * The cart footer: subtotal (with the item count), notes, the primary
 * "Ir a pagar" CTA and a secondary action.
 */
export function CartSummary({
  subtotal,
  itemCountLabel,
  notes = [],
  checkoutHref,
  secondaryAction,
  title,
  headingLevel = 2,
  className,
  ...props
}: CartSummaryProps) {
  return (
    <div {...props} className={cn("flex flex-col gap-4", className)}>
      {title ? (
        <Heading level={headingLevel} size="title">
          {title}
        </Heading>
      ) : null}
      <dl className="flex items-baseline justify-between gap-4">
        <dt className="text-body text-foreground">
          Subtotal{" "}
          <span className="text-body-sm text-muted-foreground">
            ({itemCountLabel})
          </span>
        </dt>
        <dd>
          <Price amount={subtotal} size="lg" />
        </dd>
      </dl>
      {notes.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note}>
              <Text size="body-sm" tone="muted" className="text-pretty">
                {note}
              </Text>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-col gap-3">
        <Button asChild size="lg">
          <Link href={checkoutHref}>Ir a pagar</Link>
        </Button>
        {secondaryAction}
      </div>
    </div>
  );
}
