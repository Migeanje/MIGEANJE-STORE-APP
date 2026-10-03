import { ChevronDown } from "lucide-react";
import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "@/shared/lib/cn";
import {
  AvailabilityIndicator,
  type AvailabilityStatus,
} from "@/shared/ui/atoms/availability-indicator";
import { Heading, type HeadingLevel } from "@/shared/ui/atoms/heading";
import { Price } from "@/shared/ui/atoms/price";
import { Text } from "@/shared/ui/atoms/text";

export type OrderSummaryLine = {
  /** Unique per line, e.g. the SKU. */
  key: string;
  name: string;
  variantLabel?: string;
  quantity: number;
  /** Unit price × quantity, in céntimos. */
  lineTotal: number;
  /** The label carries the lead time, e.g. "En importación · llega en 15–20 días". */
  availability: { status: AvailabilityStatus; label: string };
};

export type OrderSummaryProps = Omit<ComponentProps<"section">, "children"> & {
  /** Defaults to "Resumen del pedido". */
  title?: string;
  /** Outline level of the title. Defaults to 2. */
  headingLevel?: HeadingLevel;
  lines: readonly OrderSummaryLine[];
  /** In céntimos. */
  subtotal: number;
  /** In céntimos; null while it depends on the address. */
  shipping: number | null;
  /** Defaults to "Envío", e.g. "Envío a Lima Metropolitana". */
  shippingLabel?: string;
  /** In céntimos; null until shipping is known (the subtotal is shown). */
  total: number | null;
  /** Notes under the totals: taxes, delivery, how a backorder ships. */
  notes?: readonly string[];
  /** E.g. an "Editar carrito" link under the title. */
  action?: ReactNode;
  /**
   * On phones the lines and totals hide behind a disclosure whose summary
   * shows the total (a native `<details>`, so it works without JavaScript).
   */
  collapsible?: boolean;
};

const COUNT_FORMAT = new Intl.NumberFormat("es-PE");

function itemCount(lines: readonly OrderSummaryLine[]): string {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  return `${COUNT_FORMAT.format(count)} ${count === 1 ? "producto" : "productos"}`;
}

function SummaryBody({
  lines,
  subtotal,
  shipping,
  shippingLabel,
  total,
}: Pick<
  OrderSummaryProps,
  "lines" | "subtotal" | "shipping" | "shippingLabel" | "total"
>) {
  return (
    <>
      <ul className="flex flex-col divide-y divide-border">
        {lines.map((line) => (
          <li
            key={line.key}
            className="flex items-start justify-between gap-4 py-4 first:pt-0"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <Text className="text-pretty">{line.name}</Text>
              {line.variantLabel ? (
                <Text size="body-sm" tone="muted">
                  {line.variantLabel}
                </Text>
              ) : null}
              <Text size="body-sm" tone="muted">
                Cantidad: {line.quantity}
              </Text>
              <AvailabilityIndicator status={line.availability.status}>
                {line.availability.label}
              </AvailabilityIndicator>
            </div>
            <Price amount={line.lineTotal} size="sm" className="shrink-0" />
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2 border-t pt-4">
        <dt className="text-body-sm text-muted-foreground">Subtotal</dt>
        <dd className="text-right">
          <Price amount={subtotal} size="sm" />
        </dd>
        <dt className="text-body-sm text-muted-foreground">
          {shippingLabel ?? "Envío"}
        </dt>
        <dd className="text-right text-body-sm text-foreground">
          {shipping === null ? (
            "Se calcula con tu dirección"
          ) : (
            <Price amount={shipping} size="sm" />
          )}
        </dd>
        <dt className="text-body font-medium text-foreground">Total</dt>
        <dd className="text-right">
          <Price amount={total ?? subtotal} size="lg" />
        </dd>
      </dl>
    </>
  );
}

function SummaryNotes({ notes }: { notes: readonly string[] }) {
  if (notes.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note) => (
        <li key={note}>
          <Text size="body-sm" tone="muted" className="text-pretty">
            {note}
          </Text>
        </li>
      ))}
    </ul>
  );
}

/**
 * What the customer is buying: each line with its quantity, availability
 * (lead time) and total, then subtotal, shipping and total in soles, and
 * notes. On phones the lines and totals can collapse into a disclosure that
 * shows the total; the notes (delivery estimate, lead time) stay visible.
 */
export function OrderSummary({
  title = "Resumen del pedido",
  headingLevel = 2,
  lines,
  subtotal,
  shipping,
  shippingLabel,
  total,
  notes,
  action,
  collapsible = false,
  className,
  ...props
}: OrderSummaryProps) {
  const headingId = useId();
  const body = (
    <SummaryBody
      lines={lines}
      subtotal={subtotal}
      shipping={shipping}
      shippingLabel={shippingLabel}
      total={total}
    />
  );

  return (
    <section
      {...props}
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <Heading id={headingId} level={headingLevel} size="title">
          {title}
        </Heading>
        {action}
      </div>
      {collapsible ? (
        <>
          <details className="group lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2 text-body-sm text-foreground">
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition-transform duration-(--duration-fast) group-open:rotate-180"
                />
                Ver detalle ({itemCount(lines)})
              </span>
              <Price amount={total ?? subtotal} size="md" />
            </summary>
            <div className="flex flex-col gap-4 pt-4">{body}</div>
          </details>
          <div className="hidden lg:flex lg:flex-col lg:gap-4">{body}</div>
        </>
      ) : (
        body
      )}
      {/* Always visible, also on phones: delivery estimate and lead time. */}
      <SummaryNotes notes={notes ?? []} />
    </section>
  );
}
