import Link from "next/link";
import { type ReactNode, useId } from "react";
import { CART_PATH } from "@/modules/cart/ui/cart-paths";
import type { CheckoutStep } from "@/modules/checkout/domain/checkout-draft";
import { Heading } from "@/shared/ui/atoms/heading";
import { CheckoutSteps } from "@/shared/ui/molecules/checkout-steps";
import { OrderSummary } from "@/shared/ui/organisms/order-summary";
import { CHECKOUT_TITLE, STEP_LABELS } from "./checkout-copy";
import { checkoutSteps, type OrderSummaryView } from "./checkout-view";

export type CheckoutShellProps = {
  step: CheckoutStep;
  summary: OrderSummaryView;
  /** The step's form. */
  children: ReactNode;
};

/**
 * Layout of every checkout step: title, progress, the step (left on wide
 * screens) and the order summary (right; first and collapsed on phones, so
 * the total is visible before the form).
 */
export function CheckoutShell({ step, summary, children }: CheckoutShellProps) {
  const stepHeadingId = useId();
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-6">
        <Heading level={1} size="display-l">
          {CHECKOUT_TITLE}
        </Heading>
        <CheckoutSteps steps={checkoutSteps(step)} className="max-w-2xl" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-12">
        <OrderSummary
          {...summary}
          collapsible
          action={
            <Link
              href={CART_PATH}
              className="shrink-0 text-body-sm text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Editar carrito
            </Link>
          }
          className="rounded-lg border bg-card p-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1"
        />
        <section
          aria-labelledby={stepHeadingId}
          className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1"
        >
          <Heading id={stepHeadingId} level={2} size="title">
            {STEP_LABELS[step]}
          </Heading>
          {children}
        </section>
      </div>
    </div>
  );
}
