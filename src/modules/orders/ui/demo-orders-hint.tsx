import Link from "next/link";
import { useId } from "react";
import { Text } from "@/shared/ui/atoms/text";
import { TRACKING_COPY } from "./order-copy";

export type DemoOrdersHintProps = {
  email: string;
  orders: readonly { number: string; status: string; href: string }[];
};

/**
 * DATA_SOURCE=mock only: the demo email and order numbers to try on the
 * tracking page. Each number links to the page with it prefilled.
 */
export function DemoOrdersHint({ email, orders }: DemoOrdersHintProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 rounded-lg border border-dashed p-4"
    >
      <h2 id={headingId} className="text-body-sm font-medium text-foreground">
        {TRACKING_COPY.demoTitle}
      </h2>
      <Text size="body-sm" tone="muted" className="text-pretty">
        {TRACKING_COPY.demoIntro}{" "}
        <span className="font-mono text-foreground">{email}</span>{" "}
        {TRACKING_COPY.demoOrders}
      </Text>
      <ul className="flex flex-col">
        {orders.map((order) => (
          <li
            key={order.number}
            className="flex flex-wrap items-center gap-x-2 text-body-sm"
          >
            <Link
              href={order.href}
              className="inline-flex min-h-9 items-center font-mono text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {order.number}
            </Link>
            <span className="text-muted-foreground">· {order.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
