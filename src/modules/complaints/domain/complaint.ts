import * as z from "zod";
import { moneySchema } from "@/modules/cart/domain/cart";
import {
  identityDocumentSchema,
  isValidRuc,
  normalizeEmail,
  personNameSchema,
} from "@/modules/checkout/domain/customer";
import { addBusinessDays, limaDate } from "@/modules/checkout/domain/delivery";
import { resolvedUbigeoSchema } from "@/modules/checkout/domain/ubigeo";
import { orderNumberSchema } from "@/modules/orders/domain/order";

/*
 * A Hoja de Reclamación of the virtual Libro de Reclamaciones (Ley 29571,
 * arts. 150–152; Reglamento D.S. 011-2011-PCM as amended, Anexo I of D.S.
 * 101-2022-PCM): the provider's identification, a correlative number and the
 * filing date and time, the consumer (with a parent or representative for a
 * minor), the good or service, whether it is a reclamo or a queja, the
 * detail and what the consumer asks for. The provider's answer
 * (observaciones y acciones adoptadas) arrives later.
 *
 * What the consumer must give: only what makes a claim "filed" under the
 * Reglamento (name, document, address or email, date and detail; this book
 * also needs the email to send the copy automatically) plus the reclamo/queja
 * choice and the declaration. The rest of the Hoja (phone, amount, good
 * description, order number, pedido) is optional: the book never refuses a
 * claim the law accepts.
 */

/**
 * "000000001-2026": the Anexo I format ("Nº 000000001-202X"), a 9-digit
 * correlative that starts again every year (in Lima), then the year.
 */
export const COMPLAINT_NUMBER_PATTERN = /^\d{9}-\d{4}$/;
export const complaintNumberSchema = z
  .string()
  .regex(
    COMPLAINT_NUMBER_PATTERN,
    "Expected a complaint number like 000000001-2026",
  );

const MAX_SEQUENCE = 999_999_999;

/**
 * Reclamo: disconformity with the products or services. Queja: disconformity
 * not related to them, or discontent with how the customer was attended.
 */
export const COMPLAINT_KINDS = ["reclamo", "queja"] as const;
export type ComplaintKind = (typeof COMPLAINT_KINDS)[number];

/** What the complaint is about: a product (what we sell) or a service. */
export const GOOD_TYPES = ["producto", "servicio"] as const;
export type GoodType = (typeof GOOD_TYPES)[number];

/**
 * How the consumer wants the answer: the Reglamento (arts. 6 and 6-B) has
 * the provider answer in writing, by letter and/or email, as the consumer
 * asked.
 */
export const RESPONSE_CHANNELS = ["email", "carta"] as const;
export type ResponseChannel = (typeof RESPONSE_CHANNELS)[number];

/**
 * Business days the provider has to answer, and they cannot be extended
 * (Ley 29571 art. 24.1 as amended by Ley 31435; Reglamento arts. 6 and 6-B).
 * Public holidays are not skipped yet: the date shown can be a day or two
 * early around them, never late.
 */
export const RESPONSE_BUSINESS_DAYS = 15;

/** A phone number as digits only (mobile, landline or foreign). */
export const COMPLAINT_PHONE_PATTERN = /^\d{6,15}$/;

/**
 * "<sequence with 9 digits>-<year>". Throws a RangeError for a year that is
 * not 4 digits or a sequence outside 1–999999999.
 */
export function formatComplaintNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError(`A complaint year must have 4 digits, got ${year}`);
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > MAX_SEQUENCE) {
    throw new RangeError(
      `A complaint sequence must be an integer from 1 to ${MAX_SEQUENCE}, got ${sequence}`,
    );
  }
  return `${String(sequence).padStart(9, "0")}-${year}`;
}

/** The year in Lima of a filing: it starts the correlative again. */
export function complaintYear(filedAt: Date): number {
  return Number(limaDate(filedAt).slice(0, 4));
}

/**
 * The last day to answer a complaint filed at `filedAt`: RESPONSE_BUSINESS_DAYS
 * business days after its date in Lima (Monday to Friday; holidays not
 * modeled yet), as "YYYY-MM-DD".
 */
export function responseDueDate(filedAt: Date): string {
  return addBusinessDays(limaDate(filedAt), RESPONSE_BUSINESS_DAYS);
}

/**
 * Who answers the complaint (the store). DRAFT: `null` while the razón
 * social, the RUC or the address are not defined yet ("por definir").
 */
export const providerIdentificationSchema = z.strictObject({
  tradeName: z.string().trim().min(1),
  legalName: z.string().trim().min(1).nullable(),
  ruc: z
    .string()
    .refine(isValidRuc, "Expected a RUC with a valid check digit")
    .nullable(),
  address: z.string().trim().min(1).nullable(),
});

const normalizedEmailSchema = z
  .email()
  .max(254)
  .refine((email) => email === normalizeEmail(email), {
    message: "Expected a normalized (trimmed, lowercase) email",
  });

const phoneSchema = z
  .string()
  .regex(COMPLAINT_PHONE_PATTERN, "Expected a phone number as digits");

/**
 * The parent or representative of a consumer who is a minor (Reglamento
 * art. 5): their name, and how to reach them when the consumer gave it.
 */
export const guardianSchema = z.strictObject({
  fullName: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(150).nullable(),
  phone: phoneSchema.nullable(),
  email: normalizedEmailSchema.nullable(),
});

export const complaintConsumerSchema = z.strictObject({
  firstName: personNameSchema,
  lastName: personNameSchema,
  document: identityDocumentSchema,
  /** Normalized (lowercase): the copy of the sheet goes here. */
  email: normalizedEmailSchema,
  phone: phoneSchema.nullable(),
  address: z.strictObject({
    line: z.string().trim().min(1).max(150),
    ubigeo: resolvedUbigeoSchema,
  }),
  /** Null for an adult consumer. */
  guardian: guardianSchema.nullable(),
});

export const contractedGoodSchema = z.strictObject({
  type: z.enum(GOOD_TYPES),
  /** Our order number, when the consumer gave one. */
  orderNumber: orderNumberSchema.nullable(),
  /** Monto reclamado in céntimos; null when the consumer claims no amount. */
  amount: moneySchema.nullable(),
  description: z.string().trim().min(1).max(500).nullable(),
});

export const claimSchema = z.strictObject({
  kind: z.enum(COMPLAINT_KINDS),
  /** What happened. */
  detail: z.string().trim().min(1).max(4000),
  /** What the consumer asks for (pedido), when they say it. */
  request: z.string().trim().min(1).max(2000).nullable(),
});

const complaintFields = {
  /** Secret for the constancia right after filing (never shown). */
  accessToken: z.uuid(),
  /** When it was filed (ISO instant): the date and time of the Hoja. */
  filedAt: z.iso.datetime(),
  /** Last day to answer (date in Lima). */
  responseDueDate: z.iso.date(),
  /** The provider as it was identified when the complaint was filed. */
  provider: providerIdentificationSchema,
  consumer: complaintConsumerSchema,
  goods: contractedGoodSchema,
  claim: claimSchema,
  responseChannel: z.enum(RESPONSE_CHANNELS),
  /** The consumer declared the facts true (the virtual sheet's signature). */
  declarationAccepted: z.literal(true),
  /** When the copy reached the consumer's email; null until it is sent. */
  copySentAt: z.iso.datetime().nullable(),
};

/**
 * The filing instant, or null when `filedAt` is not a date (Zod still runs
 * object refinements after a field issue; that issue is reported already).
 */
function filingInstant(filedAt: string): Date | null {
  const instant = new Date(filedAt);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

function dueDateFollowsTheRule(sheet: {
  filedAt: string;
  responseDueDate: string;
}): boolean {
  const filedAt = filingInstant(sheet.filedAt);
  return filedAt === null || sheet.responseDueDate === responseDueDate(filedAt);
}

function numberHasTheFilingYear(sheet: {
  number: string;
  filedAt: string;
}): boolean {
  const filedAt = filingInstant(sheet.filedAt);
  return (
    filedAt === null ||
    sheet.number.slice(-4) === String(complaintYear(filedAt))
  );
}

const DUE_DATE_ISSUE = {
  message: `responseDueDate must be ${RESPONSE_BUSINESS_DAYS} business days after the filing date in Lima`,
  path: ["responseDueDate"],
};

/** A complaint ready to file: everything but its number. */
export const newComplaintSchema = z
  .strictObject(complaintFields)
  .refine(dueDateFollowsTheRule, DUE_DATE_ISSUE);

/** A filed Hoja de Reclamación. */
export const complaintSheetSchema = z
  .strictObject({ number: complaintNumberSchema, ...complaintFields })
  .refine(dueDateFollowsTheRule, DUE_DATE_ISSUE)
  .refine(numberHasTheFilingYear, {
    message: "The number must carry the year of the filing in Lima",
    path: ["number"],
  });

export type ProviderIdentification = z.infer<
  typeof providerIdentificationSchema
>;
export type ComplaintConsumer = z.infer<typeof complaintConsumerSchema>;
export type Guardian = z.infer<typeof guardianSchema>;
export type ContractedGood = z.infer<typeof contractedGoodSchema>;
export type Claim = z.infer<typeof claimSchema>;
export type NewComplaint = z.infer<typeof newComplaintSchema>;
export type ComplaintSheet = z.infer<typeof complaintSheetSchema>;
