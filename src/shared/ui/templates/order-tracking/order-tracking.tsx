import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useId } from "react";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import {
  type OrderStatusStep,
  OrderStatusTimeline,
} from "@/shared/ui/organisms/order-status-timeline";
import {
  OrderSummary,
  type OrderSummaryProps,
} from "@/shared/ui/organisms/order-summary";

export type TrackedOrder = {
  /** "MG-2026-480315", shown in Geist Mono. */
  number: string;
  /** Label of the current status, e.g. "En importación". */
  status: string;
  /** When it was bought: visible text + ISO date. */
  placedOn: { label: string; dateTime: string };
  steps: readonly OrderStatusStep[];
  /** E.g. where the updates go, with the email partly hidden. */
  updatesNote?: string;
  /** Estimated (or actual) delivery + shipping detail. */
  delivery: { title: string; detail: string };
  /** What "En importación" means; only while the order is importing. */
  importNote?: { title: string; paragraphs: readonly string[] };
  /** Partly hidden on a public page, e.g. "Ana P.". */
  recipient: string;
  /** Partly hidden address, one line per item. */
  shippingAddress: readonly string[];
  /** The receipt type, without document numbers. */
  receipt: string;
  summary: Omit<OrderSummaryProps, "title" | "collapsible">;
};

export type TrackingHelpLink = { href: string; label: string };

export type OrderTrackingProps = {
  /** Under the title while there is no order. */
  intro: string;
  /** The order to show; without it the page shows `lookup`. */
  order?: TrackedOrder;
  /** The lookup form (number + email), shown without an order. */
  lookup?: ReactNode;
  /** Under the lookup, e.g. demo data. */
  lookupAside?: ReactNode;
  /** Under the order, e.g. "Consultar otro pedido". */
  orderActions?: ReactNode;
  helpLinks: readonly TrackingHelpLink[];
};

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-lg border bg-card p-6"
    >
      <Heading id={headingId} level={2} size="title">
        {title}
      </Heading>
      {children}
    </section>
  );
}

function HelpLinks({ links }: { links: readonly TrackingHelpLink[] }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <Heading id={headingId} level={2} size="title">
        ¿Necesitas ayuda?
      </Heading>
      <ul className="flex flex-wrap gap-x-6 gap-y-1">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex min-h-11 items-center text-body text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrderDetails({
  order,
  actions,
}: {
  order: TrackedOrder;
  actions?: ReactNode;
}) {
  const timelineHeadingId = useId();
  return (
    <>
      <header className="flex flex-col gap-3">
        <Heading level={1} size="display-l" className="text-balance">
          Seguimiento de pedido
        </Heading>
        <Text className="text-pretty">
          Pedido{" "}
          <span className="font-mono font-medium whitespace-nowrap">
            {order.number}
          </span>{" "}
          · del{" "}
          <time dateTime={order.placedOn.dateTime}>{order.placedOn.label}</time>
        </Text>
        <p className="inline-flex items-center gap-2 text-body text-foreground">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-full bg-primary shadow-glow"
          />
          <span>
            Estado actual:{" "}
            <strong className="font-medium">{order.status}</strong>
          </span>
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <section
            aria-labelledby={timelineHeadingId}
            className="flex flex-col gap-5 rounded-lg border bg-card p-6"
          >
            <Heading id={timelineHeadingId} level={2} size="title">
              Estado del pedido
            </Heading>
            <OrderStatusTimeline steps={order.steps} />
            {order.updatesNote ? (
              <Text size="body-sm" tone="muted" className="text-pretty">
                {order.updatesNote}
              </Text>
            ) : null}
          </section>

          <Panel title="Entrega">
            <div className="flex flex-col gap-1">
              <Text className="font-medium text-pretty">
                {order.delivery.title}
              </Text>
              <Text size="body-sm" tone="muted" mono>
                {order.delivery.detail}
              </Text>
            </div>
            {order.importNote ? (
              <div className="flex gap-3 rounded-md border bg-surface-raised p-4">
                <PackageSearch
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-foreground"
                />
                <div className="flex flex-col gap-2">
                  <Heading level={3} className="text-body font-medium">
                    {order.importNote.title}
                  </Heading>
                  {order.importNote.paragraphs.map((paragraph) => (
                    <Text
                      key={paragraph}
                      size="body-sm"
                      className="text-pretty"
                    >
                      {paragraph}
                    </Text>
                  ))}
                </div>
              </div>
            ) : null}
          </Panel>

          <Panel title="Datos del pedido">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <dt className="text-body-sm text-muted-foreground">
                  Recibe el pedido
                </dt>
                <dd className="text-body text-foreground">{order.recipient}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-body-sm text-muted-foreground">
                  Dirección de entrega
                </dt>
                <dd className="flex flex-col text-body text-foreground">
                  {order.shippingAddress.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-body-sm text-muted-foreground">
                  Comprobante
                </dt>
                <dd className="text-body text-foreground">{order.receipt}</dd>
              </div>
            </dl>
            <Text size="body-sm" tone="muted" className="text-pretty">
              Por tu seguridad, aquí mostramos solo parte de tus datos.
            </Text>
          </Panel>

          {actions ? <div>{actions}</div> : null}
        </div>

        <OrderSummary
          {...order.summary}
          className="rounded-lg border bg-card p-6 lg:sticky lg:top-24"
        />
      </div>
    </>
  );
}

/**
 * Public order tracking. Without an order: the title, an intro, the lookup
 * form (a slot, wired by the orders module) and an optional aside. With an
 * order: its number (Geist Mono), current status, the LED timeline, the
 * delivery estimate with the "En importación" explanation, partly hidden
 * delivery data, the order summary and an actions slot. Help links always.
 */
export function OrderTracking({
  intro,
  order,
  lookup,
  lookupAside,
  orderActions,
  helpLinks,
}: OrderTrackingProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-8 lg:py-16">
      {order ? (
        <OrderDetails order={order} actions={orderActions} />
      ) : (
        <div className="flex max-w-xl flex-col gap-6">
          <header className="flex flex-col gap-3">
            <Heading level={1} size="display-l" className="text-balance">
              Seguimiento de pedido
            </Heading>
            <Text tone="muted" className="text-pretty">
              {intro}
            </Text>
          </header>
          <div className="rounded-lg border bg-card p-6">{lookup}</div>
          {lookupAside}
        </div>
      )}
      <HelpLinks links={helpLinks} />
    </div>
  );
}
