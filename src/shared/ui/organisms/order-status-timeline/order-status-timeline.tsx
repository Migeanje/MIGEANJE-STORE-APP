import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { Text } from "@/shared/ui/atoms/text";

export type OrderStatusStepState = "done" | "current" | "pending";

export type OrderStatusStep = {
  /** Unique per step, e.g. the status id. */
  id: string;
  /** E.g. "En importación". */
  label: string;
  /** One short sentence about the step. */
  description?: string;
  state: OrderStatusStepState;
  /** When the step was reached (done and current steps): visible text + ISO date. */
  reachedAt?: { label: string; dateTime: string };
};

export type OrderStatusTimelineProps = Omit<
  ComponentProps<"ol">,
  "children"
> & {
  /** In order: done steps, then exactly one current step, then pending ones. */
  steps: readonly OrderStatusStep[];
};

// Charger pilot lights: on, on and glowing (now), off.
const ledVariants = cva("size-3 shrink-0 rounded-full", {
  variants: {
    state: {
      done: "bg-primary",
      current: "bg-primary shadow-glow",
      pending: "border-2 border-led-off",
    } satisfies Record<OrderStatusStepState, string>,
  },
});

const STATE_TEXT: Record<OrderStatusStepState, string> = {
  done: "Completado",
  current: "Estado actual",
  pending: "Pendiente",
};

const STATE_ORDER: Record<OrderStatusStepState, number> = {
  done: 0,
  current: 1,
  pending: 2,
};

function assertValidSteps(steps: readonly OrderStatusStep[]) {
  const currents = steps.filter((step) => step.state === "current").length;
  if (currents !== 1) {
    throw new RangeError(
      `OrderStatusTimeline needs exactly one current step, got ${currents}`,
    );
  }
  steps.forEach((step, index) => {
    const previous = steps[index - 1];
    if (previous && STATE_ORDER[previous.state] > STATE_ORDER[step.state]) {
      throw new RangeError(
        `OrderStatusTimeline steps must be done, then current, then pending; "${step.id}" is ${step.state} after a ${previous.state} step`,
      );
    }
  });
}

/**
 * The statuses of an order as a vertical row of LEDs: done steps are lit
 * amber, the current one glows and says "Estado actual" (`aria-current`),
 * pending ones are `led-off` rings. Every step also says its state in words
 * (never color only) and when it was reached. Throws a RangeError unless the
 * steps are done, then exactly one current, then pending.
 */
export function OrderStatusTimeline({
  steps,
  className,
  ...props
}: OrderStatusTimelineProps) {
  assertValidSteps(steps);
  const lastIndex = steps.length - 1;

  return (
    <ol {...props} className={cn("flex flex-col", className)}>
      {steps.map((step, index) => (
        <li
          key={step.id}
          data-state={step.state}
          aria-current={step.state === "current" ? "step" : undefined}
          className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-4"
        >
          <span aria-hidden="true" className="flex flex-col items-center">
            <span
              data-slot="led"
              aria-hidden="true"
              className={cn(ledVariants({ state: step.state }), "mt-1.5")}
            />
            {index < lastIndex ? (
              <span
                className={cn(
                  "mt-1.5 w-0.5 flex-1 rounded-full",
                  step.state === "done" ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </span>
          <span
            className={cn(
              "flex flex-col gap-1",
              index < lastIndex ? "pb-6" : undefined,
            )}
          >
            <span
              className={cn(
                "text-body",
                step.state === "pending"
                  ? "text-muted-foreground"
                  : "font-medium text-foreground",
              )}
            >
              {step.label}
            </span>
            <span
              className={cn(
                "font-mono text-body-sm",
                step.state === "current"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {STATE_TEXT[step.state]}
              {step.state !== "pending" && step.reachedAt ? (
                <>
                  {" · "}
                  <time dateTime={step.reachedAt.dateTime}>
                    {step.reachedAt.label}
                  </time>
                </>
              ) : null}
            </span>
            {step.description ? (
              <Text
                as="span"
                size="body-sm"
                tone="muted"
                className="text-pretty"
              >
                {step.description}
              </Text>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
