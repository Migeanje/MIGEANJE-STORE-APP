"use client";

import { Check } from "lucide-react";
import { type ComponentProps, type MouseEvent, useState } from "react";
import { cn } from "@/shared/lib/cn";

export const chipClassName = [
  // 36px tall: above the 24px minimum target, compact for filter rows.
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border px-3 whitespace-nowrap select-none",
  "font-sans text-body-sm font-medium",
  "border-border bg-surface-raised text-foreground hover:border-input",
  // "Encendido": a pressed chip lights up in amber.
  "aria-pressed:border-primary aria-pressed:text-primary aria-pressed:shadow-glow",
  "transition-[border-color,color,box-shadow] duration-(--duration-fast) ease-out",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
].join(" ");

export type ChipProps = Omit<
  ComponentProps<"button">,
  "type" | "aria-pressed"
> & {
  /** Controlled pressed state. Pair it with `onPressedChange`. */
  pressed?: boolean;
  /** Initial pressed state when uncontrolled. */
  defaultPressed?: boolean;
  /** Called with the next pressed state on every toggle. */
  onPressedChange?: (pressed: boolean) => void;
};

/**
 * Toggleable filter: a native button with `aria-pressed`, so Enter and Space
 * work for free. Controlled (`pressed`) or uncontrolled (`defaultPressed`).
 * `onClick` runs first; calling `event.preventDefault()` cancels the toggle.
 */
export function Chip({
  pressed,
  defaultPressed = false,
  onPressedChange,
  onClick,
  className,
  children,
  ...props
}: ChipProps) {
  const [uncontrolledPressed, setUncontrolledPressed] =
    useState(defaultPressed);
  const isControlled = pressed !== undefined;
  const isPressed = isControlled ? pressed : uncontrolledPressed;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const next = !isPressed;
    if (!isControlled) setUncontrolledPressed(next);
    onPressedChange?.(next);
  }

  return (
    <button
      {...props}
      type="button"
      aria-pressed={isPressed}
      onClick={handleClick}
      className={cn(chipClassName, className)}
    >
      {/* Shape, not only color, marks the pressed state. */}
      {isPressed ? (
        <span aria-hidden="true" className="inline-flex">
          <Check />
        </span>
      ) : null}
      {children}
    </button>
  );
}
