import { cva } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type AvailabilityStatus = "in_stock" | "backorder" | "unavailable";

const indicatorVariants = cva(
  "inline-flex items-center gap-2 font-mono text-body-sm",
  {
    variants: {
      status: {
        in_stock: "text-foreground",
        backorder: "text-foreground",
        unavailable: "text-muted-foreground",
      } satisfies Record<AvailabilityStatus, string>,
    },
  },
);

// A charger pilot light: lit, half-lit, off.
const ledVariants = cva("size-2.5 shrink-0 rounded-full", {
  variants: {
    status: {
      in_stock: "bg-primary shadow-glow",
      backorder: "border-2 border-primary",
      unavailable: "border-2 border-led-off",
    } satisfies Record<AvailabilityStatus, string>,
  },
});

export type AvailabilityIndicatorProps = Omit<
  ComponentProps<"span">,
  "children"
> & {
  status: AvailabilityStatus;
  /**
   * Visible label, e.g. "En stock". Required: color is never the only signal
   * (WCAG 1.4.1). Callers map their domain availability to this copy.
   */
  children: ReactNode;
};

/** LED dot (decorative) plus a mono label describing product availability. */
export function AvailabilityIndicator({
  status,
  children,
  className,
  ...props
}: AvailabilityIndicatorProps) {
  return (
    <span
      {...props}
      data-status={status}
      className={cn(indicatorVariants({ status }), className)}
    >
      <span
        data-slot="led"
        aria-hidden="true"
        className={ledVariants({ status })}
      />
      <span>{children}</span>
    </span>
  );
}
