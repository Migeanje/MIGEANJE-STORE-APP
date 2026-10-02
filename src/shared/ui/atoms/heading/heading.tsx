import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HEADING_TAGS = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const satisfies Record<HeadingLevel, string>;

// Each type token carries its own tight leading and tracking (tokens.css).
export const headingVariants = cva("font-sans font-medium text-foreground", {
  variants: {
    size: {
      "display-xl": "text-display-xl",
      "display-l": "text-display-l",
      title: "text-title",
    },
  },
  defaultVariants: {
    size: "title",
  },
});

export type HeadingSize = NonNullable<
  VariantProps<typeof headingVariants>["size"]
>;

export type HeadingProps = ComponentProps<"h1"> & {
  /** Semantic level (document outline): 1–6 renders h1…h6. */
  level: HeadingLevel;
  /** Visual size, independent from `level`. Defaults to `title`. */
  size?: HeadingSize;
};

/**
 * Geist Sans 500 heading whose outline level and visual size are decoupled.
 * Throws a RangeError for a level outside 1–6 (e.g. from untyped data) rather
 * than clamping it, which would silently break the document outline.
 */
export function Heading({ level, size, className, ...props }: HeadingProps) {
  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw new RangeError(
      `Heading level must be an integer from 1 to 6, got ${level}`,
    );
  }
  const Component = HEADING_TAGS[level];
  return (
    <Component
      {...props}
      className={cn(headingVariants({ size }), className)}
    />
  );
}
