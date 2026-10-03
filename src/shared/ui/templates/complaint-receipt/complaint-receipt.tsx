import { CircleAlert, CircleCheck, Mail } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useId } from "react";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import {
  DescriptionList,
  type DescriptionListItem,
} from "@/shared/ui/molecules/description-list";
import { PrintButton } from "@/shared/ui/molecules/print-button";

export type ComplaintReceiptSection = {
  /** E.g. "1. Identificación del consumidor reclamante". */
  title: string;
  items: readonly DescriptionListItem[];
};

export type ComplaintReceiptProps = {
  /** E.g. "Registramos tu reclamo". */
  title: string;
  /** "000000001-2026", shown in Geist Mono. */
  number: string;
  /** When it was filed: visible text + ISO instant. */
  filedAt: { label: string; dateTime: string };
  /** Whether the copy reached the consumer's email, and what to tell them. */
  copy: { sent: boolean; text: string };
  /** When and how the answer arrives. */
  due: string;
  /** Who this copy is for, e.g. "Destinatario: consumidor (tu copia)". */
  recipient: string;
  provider: readonly DescriptionListItem[];
  /** Sections 1–4 of the Hoja, in order. */
  sections: readonly ComplaintReceiptSection[];
  legalNotes: readonly string[];
  homeHref: string;
};

function SheetSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex break-inside-avoid flex-col gap-4 rounded-lg border bg-card p-5 sm:p-6 print:p-4"
    >
      <Heading
        id={headingId}
        level={2}
        size="title"
        className="text-balance print:text-body print:font-medium"
      >
        {title}
      </Heading>
      {children}
    </section>
  );
}

/**
 * The constancia right after filing a Hoja de Reclamación: confirmation,
 * the sheet number (Geist Mono) and filing date and time, where the copy went
 * (or that it could not be sent), the answer's due date, the provider and
 * every section of the sheet, the legal notes, and print/back actions. It
 * prints on paper (the print theme in tokens.css); the actions do not.
 */
export function ComplaintReceipt({
  title,
  number,
  filedAt,
  copy,
  due,
  recipient,
  provider,
  sections,
  legalNotes,
  homeHref,
}: ComplaintReceiptProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-8 lg:py-16 print:max-w-none print:gap-5 print:p-0">
      <header className="flex flex-col gap-3">
        <CircleCheck
          aria-hidden="true"
          className="size-10 text-primary drop-shadow-[0_0_12px_var(--glow)] print:hidden"
        />
        <Heading
          level={1}
          size="display-l"
          className="text-balance print:text-title"
        >
          {title}
        </Heading>
        <Text className="text-pretty">
          Hoja de Reclamación Nº{" "}
          <span className="font-mono font-medium whitespace-nowrap">
            {number}
          </span>
        </Text>
        <Text className="text-pretty">
          Fecha y hora:{" "}
          <time dateTime={filedAt.dateTime} className="font-medium">
            {filedAt.label}
          </time>
        </Text>
        <Text size="body-sm" tone="muted">
          {recipient}
        </Text>
      </header>

      <div className="flex flex-col gap-3 rounded-lg border border-input bg-surface-raised p-5 print:p-4">
        {copy.sent ? (
          <p className="flex gap-3 text-body text-foreground">
            <Mail
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            <span className="text-pretty">{copy.text}</span>
          </p>
        ) : (
          <div role="status" className="flex gap-3 text-body text-foreground">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-destructive"
            />
            <span className="text-pretty">{copy.text}</span>
          </div>
        )}
        <Text className="font-medium text-pretty">{due}</Text>
      </div>

      <SheetSection title="Datos del proveedor">
        <DescriptionList items={provider} columns={2} />
      </SheetSection>

      {sections.map((section) => (
        <SheetSection key={section.title} title={section.title}>
          <DescriptionList items={section.items} columns={2} />
        </SheetSection>
      ))}

      <SheetSection title="Ten en cuenta">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-body-sm text-foreground marker:text-muted-foreground">
          {legalNotes.map((note) => (
            <li key={note} className="text-pretty">
              {note}
            </li>
          ))}
        </ul>
      </SheetSection>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center print:hidden">
        <PrintButton noScriptHint="Para imprimirla o guardarla como PDF, usa la opción Imprimir de tu navegador.">
          Imprimir o guardar como PDF
        </PrintButton>
        <Button asChild variant="ghost" size="lg">
          <Link href={homeHref}>Volver a la tienda</Link>
        </Button>
      </div>
    </div>
  );
}
