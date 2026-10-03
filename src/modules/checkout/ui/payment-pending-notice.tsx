import { Clock } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import { PAYMENT_PENDING_COPY } from "./checkout-copy";
import type { PendingPayment } from "./pay-action";

export type PaymentPendingNoticeProps = PendingPayment & {
  /** Outline level of the title (the payment step's own title is an h2). */
  headingLevel?: 3 | 4;
};

/**
 * The payment step of a cart whose payment was charged and is being
 * confirmed by hand: says so, gives the reference and offers no way to pay
 * again. A region named by its title.
 */
export function PaymentPendingNotice({
  reference,
  headingLevel = 3,
}: PaymentPendingNoticeProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-5 rounded-lg border border-input bg-surface-raised p-5 sm:p-6"
    >
      <div className="flex gap-3">
        <Clock
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-primary"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <Heading
            id={headingId}
            level={headingLevel}
            className="text-body font-medium"
          >
            {PAYMENT_PENDING_COPY.title}
          </Heading>
          <Text className="text-pretty">{PAYMENT_PENDING_COPY.message}</Text>
          <Text size="body-sm" tone="muted">
            {PAYMENT_PENDING_COPY.referenceLabel}:{" "}
            <span className="font-mono whitespace-nowrap text-foreground">
              {reference}
            </span>
          </Text>
        </div>
      </div>
      <div>
        <Button asChild variant="secondary">
          <Link href="/">{PAYMENT_PENDING_COPY.home}</Link>
        </Button>
      </div>
    </section>
  );
}
