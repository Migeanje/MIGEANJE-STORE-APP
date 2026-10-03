import { BookOpenText, FlaskConical } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import {
  DescriptionList,
  type DescriptionListItem,
} from "@/shared/ui/molecules/description-list";

export type ComplaintBookProps = {
  /** The legal aviso: the store keeps a Libro de Reclamaciones. */
  notice: string;
  /** What filing does (constancia, copy by email). */
  intro: string;
  /** Who answers: name, razón social, RUC, address. */
  provider: readonly DescriptionListItem[];
  /** The notes every Hoja carries (verbatim from the regulation). */
  legalNotes: readonly string[];
  /** The Hoja de Reclamación form (sections 1–3), wired by the module. */
  form: ReactNode;
  /** E.g. "no real emails" with mock data. */
  demoNote?: ReactNode;
};

const sheetBefore: readonly DescriptionListItem[] = [
  { term: "Número", details: "Se asigna al enviar" },
  { term: "Fecha y hora", details: "Se registra al enviar (hora de Lima)" },
];

/**
 * The virtual Libro de Reclamaciones: title and legal aviso, the head of the
 * Hoja de Reclamación (number and date are assigned on submit, the
 * provider's identification and the legal notes), an optional demo note and
 * the form slot. One column: long forms read top to bottom.
 */
export function ComplaintBook({
  notice,
  intro,
  provider,
  legalNotes,
  form,
  demoNote,
}: ComplaintBookProps) {
  const sheetHeadingId = useId();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-8 lg:py-16">
      <header className="flex flex-col gap-4">
        <Heading level={1} size="display-l" className="text-balance">
          Libro de Reclamaciones
        </Heading>
        <div className="flex gap-3 rounded-lg border border-input bg-surface-raised p-4">
          <BookOpenText
            aria-hidden="true"
            className="mt-0.5 size-6 shrink-0 text-primary"
          />
          <Text className="text-pretty">{notice}</Text>
        </div>
        <Text tone="muted" className="text-pretty">
          {intro}
        </Text>
      </header>

      <section
        aria-labelledby={sheetHeadingId}
        className="flex flex-col gap-6 rounded-lg border bg-card p-5 sm:p-6"
      >
        <Heading id={sheetHeadingId} level={2} size="title">
          Hoja de Reclamación
        </Heading>
        <DescriptionList items={sheetBefore} columns={2} />
        <div className="flex flex-col gap-4 border-t pt-6">
          <Heading level={3} className="text-body font-medium">
            Datos del proveedor
          </Heading>
          <DescriptionList items={provider} columns={2} />
        </div>
        <div className="flex flex-col gap-3 border-t pt-6">
          <Heading level={3} className="text-body font-medium">
            Ten en cuenta
          </Heading>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-body-sm text-foreground marker:text-muted-foreground">
            {legalNotes.map((note) => (
              <li key={note} className="text-pretty">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {demoNote ? (
        <div className="flex gap-3 rounded-lg border border-dashed border-input p-4">
          <FlaskConical
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
          />
          <Text size="body-sm" tone="muted" className="text-pretty">
            {demoNote}
          </Text>
        </div>
      ) : null}

      {form}
    </div>
  );
}
