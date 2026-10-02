import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export const textVariants = cva("", {
  variants: {
    size: {
      body: "text-body",
      "body-sm": "text-body-sm",
      caption: "text-caption",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
    },
    // Geist Mono is for data only: specs, lead times, order numbers, SKUs.
    mono: {
      true: "font-mono",
      false: "font-sans",
    },
  },
  defaultVariants: {
    size: "body",
    tone: "default",
    mono: false,
  },
});

type TextVariants = VariantProps<typeof textVariants>;
export type TextSize = NonNullable<TextVariants["size"]>;
export type TextTone = NonNullable<TextVariants["tone"]>;

export type TextProps = HTMLAttributes<HTMLElement> & {
  /** Rendered element. Defaults to `p`. */
  as?: "p" | "span" | "div";
  /** Type token. Defaults to `body` (16px/1.5). */
  size?: TextSize;
  /** `muted` for secondary copy. Defaults to `default`. */
  tone?: TextTone;
  /** Geist Mono, for data (specs, lead times, order numbers, SKUs). */
  mono?: boolean;
};

/** Body copy on the type scale. */
export function Text({
  as: Component = "p",
  size,
  tone,
  mono,
  className,
  ...props
}: TextProps) {
  return (
    <Component
      {...props}
      className={cn(textVariants({ size, tone, mono }), className)}
    />
  );
}
