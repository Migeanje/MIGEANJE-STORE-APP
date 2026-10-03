import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type AccountNavItem = { href: string; label: string };

export type AccountNavProps = Omit<ComponentProps<"nav">, "children"> & {
  /** The account sections, in order. At least one. */
  items: readonly AccountNavItem[];
  /** The href of the page being shown (`aria-current="page"`). */
  currentHref: string;
  /** After the links, e.g. the "Cerrar sesión" form. */
  footer?: ReactNode;
  /** Accessible name of the navigation. Defaults to "Tu cuenta". */
  label?: string;
};

/**
 * Navigation between the account sections: wrapping pills on phones, a
 * vertical list from `lg`. The current section is lit ("encendido") and
 * marked with `aria-current="page"`. Throws a RangeError without items.
 */
export function AccountNav({
  items,
  currentHref,
  footer,
  label = "Tu cuenta",
  className,
  ...props
}: AccountNavProps) {
  if (items.length === 0) {
    throw new RangeError("AccountNav needs at least one item");
  }

  return (
    <nav
      {...props}
      aria-label={label}
      className={cn("flex flex-col gap-4", className)}
    >
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {items.map(({ href, label: itemLabel }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={href === currentHref ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-pill border border-border px-4 text-body-sm text-muted-foreground lg:flex lg:rounded-md lg:border-transparent lg:px-3",
                "transition-colors duration-(--duration-fast) ease-out hover:text-foreground hover:bg-accent",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                "aria-[current=page]:border-primary aria-[current=page]:text-foreground lg:aria-[current=page]:border-transparent lg:aria-[current=page]:bg-surface-raised lg:aria-[current=page]:text-primary",
              )}
            >
              {itemLabel}
            </Link>
          </li>
        ))}
      </ul>
      {footer}
    </nav>
  );
}
