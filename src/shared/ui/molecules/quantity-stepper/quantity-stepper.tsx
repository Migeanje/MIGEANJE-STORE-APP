"use client";

import { Minus, Plus } from "lucide-react";
import {
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";

// Only whole, non-negative numbers can be typed: "2.5", "-1" or "e" are rejected.
const DIGITS = /^\d*$/;

function assertBound(name: "min" | "max", bound: number): void {
  if (!Number.isSafeInteger(bound) || bound < 0) {
    throw new RangeError(
      `QuantityStepper ${name} must be a non-negative integer, got ${bound}`,
    );
  }
}

function assertQuantity(
  name: "value" | "defaultValue",
  quantity: number,
  min: number,
  max: number | undefined,
): void {
  const inRange = quantity >= min && (max === undefined || quantity <= max);
  if (!Number.isSafeInteger(quantity) || !inRange) {
    const range =
      max === undefined ? `of at least ${min}` : `from ${min} to ${max}`;
    throw new RangeError(
      `QuantityStepper ${name} must be an integer ${range}, got ${quantity}`,
    );
  }
}

export type QuantityStepperProps = Omit<
  ComponentProps<"fieldset">,
  "children" | "defaultValue" | "onChange"
> & {
  /** Accessible name of the group and the field, e.g. "Cantidad". */
  label: string;
  /**
   * Controlled value, an integer within [min, max]. Pair it with
   * `onValueChange`. Reconcile it with the stock before rendering: a value
   * outside the range throws.
   */
  value?: number;
  /**
   * Initial value when uncontrolled, an integer within [min, max]. Defaults
   * to `min`. Read once on mount, like a native input's `defaultValue`.
   */
  defaultValue?: number;
  /** Lowest value, a non-negative integer. Defaults to 1. */
  min?: number;
  /** Highest value (e.g. the stock), an integer not below `min`. */
  max?: number;
  /** Called with every committed value: buttons, arrow keys, blur or Enter. */
  onValueChange?: (value: number) => void;
  disabled?: boolean;
  /** Form field name for the number input. */
  name?: string;
};

/**
 * − / number field / + for quantities. The field is a `spinbutton`: ArrowUp
 * and ArrowDown step the value; typed digits are committed on blur or Enter,
 * clamped to [min, max]. Each button is disabled at its bound, and focus then
 * moves to the field so it never falls back to the page.
 *
 * Throws a RangeError for invalid bounds and for a `value` or `defaultValue`
 * that is not an integer within [min, max]: those are programming errors (the
 * cart must reconcile quantities with the stock first). What the user types is
 * input, not an error, so it is clamped instead. If `max` later drops below the
 * uncontrolled value, the shown value is clamped too.
 */
export function QuantityStepper({
  label,
  value,
  defaultValue,
  min = 1,
  max,
  onValueChange,
  disabled = false,
  name,
  className,
  ...props
}: QuantityStepperProps) {
  assertBound("min", min);
  if (max !== undefined) {
    assertBound("max", max);
    if (max < min) {
      throw new RangeError(
        `QuantityStepper max (${max}) must not be below min (${min})`,
      );
    }
  }
  const isControlled = value !== undefined;
  if (isControlled) assertQuantity("value", value, min, max);
  const upper = max ?? Number.MAX_SAFE_INTEGER;
  const clamp = (next: number) => Math.min(Math.max(next, min), upper);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(() => {
    // Validated only here: later defaultValue changes are ignored anyway.
    if (defaultValue !== undefined) {
      assertQuantity("defaultValue", defaultValue, min, max);
    }
    return defaultValue ?? min;
  });
  // Text being typed; null when the field shows the committed value.
  const [draft, setDraft] = useState<string | null>(null);
  const current = isControlled ? value : clamp(uncontrolledValue);
  const atMin = current <= min;
  const atMax = current >= upper;

  function commit(next: number): number {
    setDraft(null);
    const clamped = clamp(next);
    if (clamped !== current) {
      if (!isControlled) setUncontrolledValue(clamped);
      onValueChange?.(clamped);
    }
    return clamped;
  }

  function commitDraft() {
    if (draft === null) return;
    if (draft === "") {
      setDraft(null);
      return;
    }
    commit(Number.parseInt(draft, 10));
  }

  function stepBy(delta: 1 | -1) {
    const next = commit(current + delta);
    // The button about to be disabled loses focus: keep it in the stepper.
    if ((delta < 0 && next <= min) || (delta > 0 && next >= upper)) {
      inputRef.current?.focus();
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (DIGITS.test(event.target.value)) setDraft(event.target.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const base = draft ? Number.parseInt(draft, 10) : current;
      commit(base + (event.key === "ArrowUp" ? 1 : -1));
    } else if (event.key === "Enter") {
      // Not prevented: Enter still submits a surrounding form.
      commitDraft();
    }
  }

  return (
    // A fieldset is a native group: its aria-label gives the − / + buttons
    // context ("Cantidad de Cargador GaN 65 W") in lists with many steppers.
    <fieldset
      {...props}
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-pill border border-input bg-card",
        className,
      )}
    >
      <Button
        variant="ghost"
        className="size-11 px-0"
        leadingIcon={<Minus />}
        disabled={disabled || atMin}
        onClick={() => stepBy(-1)}
      >
        <span className="sr-only">Disminuir cantidad</span>
      </Button>
      <Input
        ref={inputRef}
        type="text"
        role="spinbutton"
        inputMode="numeric"
        autoComplete="off"
        name={name}
        aria-label={label}
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        value={draft ?? String(current)}
        disabled={disabled}
        onChange={handleChange}
        onBlur={commitDraft}
        onKeyDown={handleKeyDown}
        className="h-11 w-12 border-0 bg-transparent px-0 text-center tabular-nums"
      />
      <Button
        variant="ghost"
        className="size-11 px-0"
        leadingIcon={<Plus />}
        disabled={disabled || atMax}
        onClick={() => stepBy(1)}
      >
        <span className="sr-only">Aumentar cantidad</span>
      </Button>
    </fieldset>
  );
}
