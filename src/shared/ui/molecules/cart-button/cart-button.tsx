"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { Button } from "@/shared/ui/atoms/button";

const MAX_BADGE_COUNT = 99;

/** "Carrito, 0 productos", "Carrito, 1 producto". */
export function cartButtonLabel(count: number): string {
  return `Carrito, ${count} ${count === 1 ? "producto" : "productos"}`;
}

export type CartButtonProps = {
  /** Units in the cart: a non-negative integer. */
  count: number;
  /** The cart page: where the link goes before (and without) JavaScript. */
  href: string;
  /**
   * Opens the cart drawer. With it, the hydrated control is a button that
   * opens a dialog; without it, it stays a link.
   */
  onOpen?: () => void;
  /** Whether the drawer it opens is open (`aria-expanded`). */
  expanded?: boolean;
  className?: string;
};

/**
 * The header cart control: a bag icon named "Carrito, N productos" with an
 * amber count badge above 0 (capped at "99+"). The server HTML is a link to
 * the cart page, so it works before and without JavaScript; once hydrated and
 * given `onOpen`, it becomes a button that opens the cart drawer.
 *
 * Throws a RangeError for a count that is not a non-negative integer.
 */
export function CartButton({
  count,
  href,
  onOpen,
  expanded = false,
  className,
}: CartButtonProps) {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError(
      `CartButton count must be a non-negative integer, got ${count}`,
    );
  }
  const hydrated = useHydrated();
  const classes = cn("size-11 px-0", className);
  const badge =
    count > 0 ? (
      <span
        data-testid="cart-count"
        className="absolute top-0.5 right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary px-1 font-mono text-caption text-primary-foreground"
      >
        {count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count}
      </span>
    ) : null;
  const label = <span className="sr-only">{cartButtonLabel(count)}</span>;

  if (onOpen && hydrated) {
    return (
      <Button
        variant="ghost"
        className={classes}
        leadingIcon={<ShoppingBag />}
        trailingIcon={badge}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        onClick={onOpen}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="ghost"
      className={classes}
      leadingIcon={<ShoppingBag />}
      trailingIcon={badge}
    >
      <Link href={href}>{label}</Link>
    </Button>
  );
}
