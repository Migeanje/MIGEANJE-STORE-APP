import { Check } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type CheckoutStepState = "complete" | "current" | "upcoming";

export type CheckoutStepItem = {
  id: string;
  label: string;
  /** Where to go back to a completed step. */
  href?: string;
  state: CheckoutStepState;
};

export type CheckoutStepsProps = Omit<ComponentProps<"nav">, "children"> & {
  steps: readonly CheckoutStepItem[];
  /** Name of the navigation. Defaults to "Pasos de la compra". */
  label?: string;
};

const bubbleClassName =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-body-sm";

function StepContent({
  index,
  step,
}: {
  index: number;
  step: CheckoutStepItem;
}): ReactNode {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          bubbleClassName,
          step.state === "complete" &&
            "border-primary bg-primary text-primary-foreground",
          step.state === "current" &&
            "border-primary text-foreground shadow-glow",
          step.state === "upcoming" && "border-border text-muted-foreground",
        )}
      >
        {step.state === "complete" ? <Check className="size-4" /> : index + 1}
      </span>
      {/* Plain-text spaces between spans: name computation trims spans. */}
      <span>
        <span className="sr-only">Paso {index + 1}:</span>{" "}
        <span>{step.label}</span>
        {step.state === "complete" ? (
          <>
            {" "}
            <span className="sr-only">(completado)</span>
          </>
        ) : null}
      </span>
    </>
  );
}

/**
 * Where the customer is in the checkout: an ordered list of steps. Completed
 * steps link back (when they have an `href`), the current one carries
 * `aria-current="step"`, upcoming ones are plain text. Throws a RangeError
 * unless exactly one step is current.
 */
export function CheckoutSteps({
  steps,
  label = "Pasos de la compra",
  className,
  ...props
}: CheckoutStepsProps) {
  const current = steps.filter((step) => step.state === "current").length;
  if (current !== 1) {
    throw new RangeError(
      `CheckoutSteps needs exactly one current step, got ${current}`,
    );
  }

  const itemClassName =
    "flex flex-col items-center gap-2 text-center text-body-sm sm:flex-row sm:text-left";

  return (
    <nav {...props} aria-label={label} className={cn("w-full", className)}>
      <ol className="grid auto-cols-fr grid-flow-col gap-2 sm:gap-6">
        {steps.map((step, index) => (
          <li key={step.id} className="min-w-0">
            {step.state === "complete" && step.href ? (
              <Link
                href={step.href}
                className={cn(
                  itemClassName,
                  "rounded-md text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                <StepContent index={index} step={step} />
              </Link>
            ) : (
              <span
                aria-current={step.state === "current" ? "step" : undefined}
                className={cn(
                  itemClassName,
                  step.state === "current"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <StepContent index={index} step={step} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
