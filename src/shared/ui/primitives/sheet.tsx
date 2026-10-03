"use client";

// shadcn/ui Sheet (Radix Dialog) restyled with our tokens. Radix provides the
// modal behavior: focus trap, Escape, focus return to the trigger, scroll lock
// and `aria-hidden` on the rest of the page.
import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { buttonVariants } from "@/shared/ui/atoms/button";

function Sheet(props: ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      {...props}
      data-slot="sheet-overlay"
      // Lenis (discovery pages) would otherwise scroll the page behind it.
      data-lenis-prevent=""
      className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
        "transition-opacity duration-(--duration-base) ease-out starting:opacity-0",
        className,
      )}
    />
  );
}

export type SheetSide = "left" | "right";

const SIDE_CLASSES = {
  left: "left-0 border-r starting:-translate-x-full",
  right: "right-0 border-l starting:translate-x-full",
} as const satisfies Record<SheetSide, string>;

export type SheetContentProps = ComponentProps<
  typeof SheetPrimitive.Content
> & {
  /** Edge the panel slides in from. Defaults to `right`. */
  side?: SheetSide;
  /** Accessible name of the close button. Defaults to "Cerrar". */
  closeLabel?: string;
  showCloseButton?: boolean;
};

/**
 * The panel, rendered in a portal over a dimmed overlay. Name it with a
 * `SheetTitle`; without a `SheetDescription`, pass `aria-describedby={undefined}`.
 * It slides in on open (instant under reduced motion) and closes instantly.
 */
function SheetContent({
  className,
  children,
  side = "right",
  closeLabel = "Cerrar",
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal data-slot="sheet-portal">
      <SheetOverlay />
      <SheetPrimitive.Content
        {...props}
        data-slot="sheet-content"
        data-lenis-prevent=""
        className={cn(
          "fixed inset-y-0 z-50 flex h-full w-4/5 max-w-sm flex-col gap-6 overflow-y-auto overscroll-contain",
          "border-border bg-card p-6 text-card-foreground",
          "transition-transform duration-(--duration-base) ease-in-out",
          SIDE_CLASSES[side],
          className,
        )}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "absolute top-4 right-4 size-11 px-0",
            )}
          >
            <X aria-hidden="true" />
            <span className="sr-only">{closeLabel}</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      // Leaves room for the close button.
      className={cn("flex flex-col gap-1.5 pr-12", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-sans text-title font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-body-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
