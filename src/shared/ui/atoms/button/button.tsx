import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill font-medium select-none",
    "transition-[background-color,border-color,box-shadow] duration-(--duration-fast) ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    // A loading button is disabled too, but keeps full opacity behind its spinner.
    "disabled:pointer-events-none disabled:not-aria-busy:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // "Encendido": the amber glow turns on at hover and keyboard focus.
        primary:
          "bg-primary text-primary-foreground hover:shadow-glow focus-visible:shadow-glow",
        secondary:
          "border border-border bg-surface-raised text-foreground hover:border-input",
        ghost:
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-9 px-4 text-body-sm [&_svg]:size-4", // 36px
        md: "h-11 px-6 text-body [&_svg]:size-4", // 44px: mobile default
        lg: "h-14 px-8 text-body [&_svg]:size-5", // 56px
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonBaseProps = Omit<ComponentProps<"button">, "children"> &
  VariantProps<typeof buttonVariants> & {
    children: ReactNode;
    /** Decorative icon before the label; always hidden from assistive tech. */
    leadingIcon?: ReactNode;
    /** Decorative icon after the label; always hidden from assistive tech. */
    trailingIcon?: ReactNode;
  };

export type ButtonProps = ButtonBaseProps &
  (
    | {
        asChild?: false;
        /** Disables the button, sets `aria-busy` and shows a spinner. */
        loading?: boolean;
      }
    | {
        /** Renders the single child (e.g. a Next `Link`) with the button styles. */
        asChild: true;
        loading?: never;
        disabled?: never;
      }
  );

function IconSlot({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="inline-flex">
      {children}
    </span>
  );
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  type,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  const leading = leadingIcon ? <IconSlot>{leadingIcon}</IconSlot> : null;
  const trailing = trailingIcon ? <IconSlot>{trailingIcon}</IconSlot> : null;

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {leading}
        <Slot.Slottable>{children}</Slot.Slottable>
        {trailing}
      </Slot.Root>
    );
  }

  return (
    <button
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {/* Stays in the layout (and the accessible name) while loading, so the width holds. */}
      <span
        className={cn("inline-flex items-center gap-2", loading && "opacity-0")}
      >
        {leading}
        {children}
        {trailing}
      </span>
      {loading ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 inline-flex items-center justify-center"
        >
          <LoaderCircle className="motion-safe:animate-spin" />
        </span>
      ) : null}
    </button>
  );
}
