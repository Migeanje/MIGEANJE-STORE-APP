import { DOCUMENT_TYPE_LABELS } from "@/modules/checkout/ui/checkout-copy";
import type {
  ComplaintConsumer,
  ComplaintSheet,
  ProviderIdentification,
} from "@/modules/complaints/domain/complaint";
import { formatPEN } from "@/shared/lib/money";
import type { DescriptionListItem } from "@/shared/ui/molecules/description-list";
import type { ComplaintReceiptProps } from "@/shared/ui/templates/complaint-receipt";
import {
  GOOD_TYPE_LABELS,
  KIND_DEFINITIONS,
  KIND_LABELS,
  LEGAL_NOTES,
  PROVIDER_LABELS,
  RECEIPT_COPY,
  RESPONSE_CHANNEL_LABELS,
  SECTION_TITLES,
} from "./complaint-copy";

const { terms: TERMS } = RECEIPT_COPY;

// Filing time in Lima: "3 oct. 2026, 10:00 a. m.".
const TIME_FORMAT = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

// A due date is a calendar date (already in Lima): "viernes 23 de octubre de 2026".
const DATE_FORMAT = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "full",
  timeZone: "UTC",
});

function dueDateText(date: string): string {
  // es-PE's full style puts a comma after the weekday: drop it.
  return DATE_FORMAT.format(new Date(`${date}T00:00:00Z`)).replace(",", "");
}

function orNone(value: string | null): string {
  return value ?? RECEIPT_COPY.none;
}

/** The provider block of the book and the constancia. */
export function providerItems(
  provider: ProviderIdentification,
): DescriptionListItem[] {
  const pending = PROVIDER_LABELS.pending;
  return [
    { term: PROVIDER_LABELS.tradeName, details: provider.tradeName },
    { term: PROVIDER_LABELS.legalName, details: provider.legalName ?? pending },
    { term: PROVIDER_LABELS.ruc, details: provider.ruc ?? pending, mono: true },
    { term: PROVIDER_LABELS.address, details: provider.address ?? pending },
  ];
}

function consumerItems(consumer: ComplaintConsumer): DescriptionListItem[] {
  const { ubigeo } = consumer.address;
  const items: DescriptionListItem[] = [
    {
      term: TERMS.name,
      details: `${consumer.firstName} ${consumer.lastName}`,
    },
    {
      term: TERMS.document,
      details: `${DOCUMENT_TYPE_LABELS[consumer.document.type]} ${consumer.document.number}`,
    },
    {
      term: TERMS.address,
      details: [
        consumer.address.line,
        `${ubigeo.distrito.name}, ${ubigeo.provincia.name}, ${ubigeo.departamento.name}`,
      ],
    },
    { term: TERMS.phone, details: orNone(consumer.phone) },
    { term: TERMS.email, details: consumer.email },
  ];
  const { guardian } = consumer;
  if (guardian) {
    items.push({
      term: TERMS.guardian,
      details: [
        guardian.fullName,
        guardian.address,
        guardian.phone,
        guardian.email,
      ].filter((line): line is string => line !== null),
    });
  }
  return items;
}

/**
 * The constancia of a filed sheet: everything the consumer submitted, in
 * the sections of Anexo I, plus the copy's status and the due date. Never
 * the access token.
 */
export function complaintReceiptView(
  sheet: ComplaintSheet,
): ComplaintReceiptProps {
  const due = dueDateText(sheet.responseDueDate);
  const { goods, claim } = sheet;
  return {
    title: RECEIPT_COPY.title(claim.kind),
    number: sheet.number,
    filedAt: {
      label: TIME_FORMAT.format(new Date(sheet.filedAt)),
      dateTime: sheet.filedAt,
    },
    copy: sheet.copySentAt
      ? { sent: true, text: RECEIPT_COPY.copySent(sheet.consumer.email) }
      : { sent: false, text: RECEIPT_COPY.copyFailed },
    due: RECEIPT_COPY.due(sheet.responseChannel, due),
    recipient: RECEIPT_COPY.recipient,
    provider: providerItems(sheet.provider),
    sections: [
      { title: SECTION_TITLES.consumer, items: consumerItems(sheet.consumer) },
      {
        title: SECTION_TITLES.goods,
        items: [
          { term: TERMS.goodType, details: GOOD_TYPE_LABELS[goods.type] },
          {
            term: TERMS.orderNumber,
            details: orNone(goods.orderNumber),
            mono: goods.orderNumber !== null,
          },
          {
            term: TERMS.amount,
            details:
              goods.amount === null
                ? RECEIPT_COPY.none
                : formatPEN(goods.amount),
          },
          { term: TERMS.description, details: orNone(goods.description) },
        ],
      },
      {
        title: SECTION_TITLES.claim,
        items: [
          { term: TERMS.kind, details: KIND_LABELS[claim.kind] },
          { term: TERMS.detail, details: claim.detail, preformatted: true },
          {
            term: TERMS.request,
            details: orNone(claim.request),
            preformatted: true,
          },
          {
            term: TERMS.responseChannel,
            details: RESPONSE_CHANNEL_LABELS[sheet.responseChannel],
          },
          { term: TERMS.declaration, details: RECEIPT_COPY.declaration },
        ],
      },
      {
        title: SECTION_TITLES.provider,
        items: [
          {
            term: TERMS.providerAnswer,
            details: RECEIPT_COPY.providerAnswerPending,
          },
          { term: TERMS.due, details: RECEIPT_COPY.dueText(due) },
          {
            term: TERMS.responseDate,
            details: RECEIPT_COPY.responseDatePending,
          },
        ],
      },
    ],
    legalNotes: [
      `${KIND_LABELS.reclamo}: ${KIND_DEFINITIONS.reclamo}`,
      `${KIND_LABELS.queja}: ${KIND_DEFINITIONS.queja}`,
      ...LEGAL_NOTES,
    ],
    homeHref: "/",
  };
}
