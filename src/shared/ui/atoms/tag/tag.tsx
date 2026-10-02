import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export const tagVariants = cva(
  "inline-flex items-center rounded-sm bg-surface-raised px-2 py-0.5 text-caption text-foreground",
  {
    variants: {
      // Geist Mono for spec values: "65 W", "USB-C", "GaN".
      mono: {
        true: "font-mono",
        false: "font-sans",
      },
    },
    defaultVariants: { mono: false },
  },
);

export type TagProps = ComponentProps<"span"> & {
  /** Geist Mono, for spec values such as "65 W", "USB-C" or "GaN". */
  mono?: boolean;
};

/** Static, non-interactive label. For a toggleable filter use `Chip`. */
export function Tag({ mono, className, ...props }: TagProps) {
  return <span {...props} className={cn(tagVariants({ mono }), className)} />;
}
