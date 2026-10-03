import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useId } from "react";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import {
  OrderSummary,
  type OrderSummaryProps,
} from "@/shared/ui/organisms/order-summary";

export type OrderConfirmationProps = {
  /** "MG-2026-004521", shown in Geist Mono. */
  orderNumber: string;
  email: string;
  /** E.g. "Llega entre el lunes 5 y el martes 6 de octubre" + "Envío a Lima · 24–48 h". */
  delivery: { title: string; detail: string };
  /** How a backorder ships; omit without backorder lines. */
  backorderNote?: ReactNode;
  /** E.g. "Boleta de venta electrónica · DNI 46027897". */
  receipt: string;
  /** The address, one line per item. */
  shippingAddress: readonly string[];
  nextSteps: readonly string[];
  summary: Omit<OrderSummaryProps, "title" | "collapsible">;
  /** Public order status page (number + email). */
  trackingHref: string;
  /** "Seguir comprando". */
  continueHref: string;
};

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-lg border bg-card p-6"
    >
      <Heading id={headingId} level={2} size="title">
        {title}
      </Heading>
      {children}
    </section>
  );
}

/**
 * The page right after paying: thanks, the order number (Geist Mono), the
 * delivery estimate with the backorder explanation, next steps, receipt and
 * address, the order summary and links to tracking and the store.
 */
export function OrderConfirmation({
  orderNumber,
  email,
  delivery,
  backorderNote,
  receipt,
  shippingAddress,
  nextSteps,
  summary,
  trackingHref,
  continueHref,
}: OrderConfirmationProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-8 lg:py-16">
      <header className="flex flex-col gap-4">
        <CircleCheck
          aria-hidden="true"
          className="size-10 text-primary drop-shadow-[0_0_12px_var(--glow)]"
        />
        <Heading level={1} size="display-l" className="text-balance">
          ¡Gracias por tu compra!
        </Heading>
        <Text className="max-w-prose text-pretty">
          Tu número de pedido es{" "}
          <span className="font-mono font-medium whitespace-nowrap text-foreground">
            {orderNumber}
          </span>
          . Te enviaremos los detalles a <strong>{email}</strong>. Guarda tu
          número: con él y tu correo puedes seguir tu pedido.
        </Text>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <Panel title="Entrega">
            <Text className="font-medium text-pretty">{delivery.title}</Text>
            <Text size="body-sm" tone="muted" mono>
              {delivery.detail}
            </Text>
            {backorderNote ? (
              <Text size="body-sm" className="text-pretty">
                {backorderNote}
              </Text>
            ) : null}
          </Panel>

          <Panel title="Próximos pasos">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-body text-foreground marker:font-mono marker:text-muted-foreground">
              {nextSteps.map((step) => (
                <li key={step} className="text-pretty">
                  {step}
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Datos del pedido">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <dt className="text-body-sm text-muted-foreground">
                  Comprobante
                </dt>
                <dd className="text-body text-foreground">{receipt}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-body-sm text-muted-foreground">
                  Dirección de entrega
                </dt>
                <dd className="flex flex-col text-body text-foreground">
                  {shippingAddress.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </dd>
              </div>
            </dl>
          </Panel>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={trackingHref}>Seguir mi pedido</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={continueHref}>Seguir comprando</Link>
            </Button>
          </div>
        </div>

        <OrderSummary
          {...summary}
          className="rounded-lg border bg-card p-6 lg:sticky lg:top-24"
        />
      </div>
    </div>
  );
}
