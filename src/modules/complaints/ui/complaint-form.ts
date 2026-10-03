import * as z from "zod";
import {
  CE_PATTERN,
  DNI_PATTERN,
  DOCUMENT_TYPES,
  type DocumentType,
  normalizeDocumentNumber,
  normalizeEmail,
  normalizePhone,
} from "@/modules/checkout/domain/customer";
import { CONTACT_MESSAGES as CONTACT } from "@/modules/checkout/ui/checkout-copy";
import {
  type FormState,
  initialFormState,
} from "@/modules/checkout/ui/checkout-forms";
import type { FileComplaintInput } from "@/modules/complaints/application/file-complaint";
import {
  COMPLAINT_KINDS,
  COMPLAINT_PHONE_PATTERN,
  type ComplaintKind,
  GOOD_TYPES,
  type GoodType,
  RESPONSE_CHANNELS,
  type ResponseChannel,
} from "@/modules/complaints/domain/complaint";
import {
  normalizeOrderNumber,
  ORDER_NUMBER_PATTERN,
} from "@/modules/orders/domain/order";
import { parseSoles } from "@/shared/lib/money";
import { COMPLAINT_MESSAGES as MESSAGES } from "./complaint-copy";

/*
 * The Hoja de Reclamación form at the UI boundary: flat string fields (what
 * FormData and React Hook Form hold), validated with the same Zod schema on
 * the client (inline errors) and on the server (authoritative), with Spanish
 * messages. Valid input becomes the `FileComplaintInput` of the use case.
 * Checkboxes post "si" (FormData) or true/false (React Hook Form); radios
 * with nothing chosen read as null.
 */

export const COMPLAINT_FIELDS = [
  "firstName",
  "lastName",
  "documentType",
  "documentNumber",
  "email",
  "phone",
  "addressLine",
  "departamento",
  "provincia",
  "distrito",
  "isMinor",
  "guardianName",
  "guardianAddress",
  "guardianPhone",
  "guardianEmail",
  "goodType",
  "orderNumber",
  "amount",
  "goodDescription",
  "kind",
  "detail",
  "request",
  "responseChannel",
  "acceptDeclaration",
] as const;
export type ComplaintField = (typeof COMPLAINT_FIELDS)[number];
export type ComplaintFormValues = Record<ComplaintField, string>;
export type ComplaintFormState = FormState<ComplaintField>;

/** The value a checked checkbox posts. */
export const CHECKED = "si";

function isChecked(value: unknown): boolean {
  return value === CHECKED || value === true;
}

function oneOf<T extends string>(options: readonly T[]) {
  return (value: unknown): value is T =>
    typeof value === "string" && (options as readonly string[]).includes(value);
}

const isDocumentType = oneOf<DocumentType>(DOCUMENT_TYPES);
const isGoodType = oneOf<GoodType>(GOOD_TYPES);
const isKind = oneOf<ComplaintKind>(COMPLAINT_KINDS);
const isResponseChannel = oneOf<ResponseChannel>(RESPONSE_CHANNELS);

const emailFormat = z.email();

function isEmail(value: string): boolean {
  return (
    value.length <= 254 && emailFormat.safeParse(normalizeEmail(value)).success
  );
}

function isPhone(value: string): boolean {
  return COMPLAINT_PHONE_PATTERN.test(normalizePhone(value));
}

/** Trimmed text, or null when empty. */
function orNull(value: string): string | null {
  return value === "" ? null : value;
}

const text = z.string().trim();

export const complaintFormSchema = z
  .object({
    firstName: text
      .min(1, CONTACT.firstNameRequired)
      .max(60, CONTACT.nameTooLong),
    lastName: text
      .min(1, CONTACT.lastNameRequired)
      .max(60, CONTACT.nameTooLong),
    documentType: z.unknown().refine(isDocumentType, {
      message: CONTACT.documentTypeRequired,
    }),
    documentNumber: text.min(1, CONTACT.documentNumberRequired),
    email: text
      .min(1, CONTACT.emailRequired)
      .refine((email) => email === "" || isEmail(email), CONTACT.emailInvalid),
    phone: text.refine(
      (phone) => phone === "" || isPhone(phone),
      MESSAGES.phoneInvalid,
    ),
    addressLine: text
      .min(1, MESSAGES.addressRequired)
      .max(150, MESSAGES.textTooLong),
    departamento: z.string().min(1, CONTACT.departamentoRequired),
    provincia: z.string().min(1, CONTACT.provinciaRequired),
    distrito: z.string().min(1, CONTACT.distritoRequired),
    isMinor: z.unknown(),
    // Checked only for a minor (below): hidden fields never block a filing.
    guardianName: text,
    guardianAddress: text,
    guardianPhone: text,
    guardianEmail: text,
    goodType: z
      .unknown()
      .refine(isGoodType, { message: MESSAGES.goodTypeRequired }),
    orderNumber: text.refine(
      (number) =>
        number === "" ||
        ORDER_NUMBER_PATTERN.test(normalizeOrderNumber(number)),
      MESSAGES.orderNumberInvalid,
    ),
    amount: text.refine(
      (amount) => amount === "" || parseSoles(amount) !== null,
      MESSAGES.amountInvalid,
    ),
    goodDescription: text.max(500, MESSAGES.descriptionTooLong),
    kind: z.unknown().refine(isKind, { message: MESSAGES.kindRequired }),
    detail: text
      .min(1, MESSAGES.detailRequired)
      .max(4000, MESSAGES.detailTooLong),
    request: text.max(2000, MESSAGES.requestTooLong),
    responseChannel: z.unknown().refine(isResponseChannel, {
      message: MESSAGES.responseChannelRequired,
    }),
    acceptDeclaration: z
      .unknown()
      .refine(isChecked, { message: MESSAGES.declarationRequired }),
  })
  .superRefine((values, ctx) => {
    const issue = (path: ComplaintField, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });

    const number = normalizeDocumentNumber(values.documentNumber ?? "");
    if (number !== "" && values.documentType === "dni") {
      if (!DNI_PATTERN.test(number))
        issue("documentNumber", CONTACT.dniInvalid);
    } else if (number !== "" && values.documentType === "ce") {
      if (!CE_PATTERN.test(number)) issue("documentNumber", CONTACT.ceInvalid);
    }

    const { departamento, provincia, distrito } = values;
    if (departamento && provincia && !provincia.startsWith(departamento)) {
      issue("provincia", CONTACT.provinciaMismatch);
    } else if (provincia && distrito && !distrito.startsWith(provincia)) {
      issue("distrito", CONTACT.distritoMismatch);
    }

    if (!isChecked(values.isMinor)) return;
    if (!values.guardianName) {
      issue("guardianName", MESSAGES.guardianNameRequired);
    } else if (values.guardianName.length > 120) {
      issue("guardianName", MESSAGES.guardianNameTooLong);
    }
    if (values.guardianAddress && values.guardianAddress.length > 150) {
      issue("guardianAddress", MESSAGES.textTooLong);
    }
    if (values.guardianPhone && !isPhone(values.guardianPhone)) {
      issue("guardianPhone", MESSAGES.phoneInvalid);
    }
    if (values.guardianEmail && !isEmail(values.guardianEmail)) {
      issue("guardianEmail", CONTACT.emailInvalid);
    }
  })
  .transform(
    (values): FileComplaintInput => ({
      consumer: {
        firstName: values.firstName,
        lastName: values.lastName,
        document: {
          type: values.documentType as DocumentType,
          number: normalizeDocumentNumber(values.documentNumber),
        },
        email: normalizeEmail(values.email),
        phone: values.phone === "" ? null : normalizePhone(values.phone),
        address: {
          line: values.addressLine,
          ubigeo: {
            departamento: values.departamento,
            provincia: values.provincia,
            distrito: values.distrito,
          },
        },
        guardian: isChecked(values.isMinor)
          ? {
              fullName: values.guardianName,
              address: orNull(values.guardianAddress),
              phone:
                values.guardianPhone === ""
                  ? null
                  : normalizePhone(values.guardianPhone),
              email:
                values.guardianEmail === ""
                  ? null
                  : normalizeEmail(values.guardianEmail),
            }
          : null,
      },
      goods: {
        type: values.goodType as GoodType,
        orderNumber:
          values.orderNumber === ""
            ? null
            : normalizeOrderNumber(values.orderNumber),
        amount: values.amount === "" ? null : parseSoles(values.amount),
        description: orNull(values.goodDescription),
      },
      claim: {
        kind: values.kind as ComplaintKind,
        detail: values.detail,
        request: orNull(values.request),
      },
      responseChannel: values.responseChannel as ResponseChannel,
      declarationAccepted: true,
    }),
  );

// Longer input from the URL is junk, not an order number.
const MAX_URL_ORDER_LENGTH = 32;

/**
 * The empty form (DNI, a product, the answer by email). `?pedido=` (e.g.
 * from the order tracking page) prefills the order number when it is
 * well-formed, and nothing else.
 */
export function complaintFormInitialState(pedido?: string): ComplaintFormState {
  const values: Partial<ComplaintFormValues> = {
    documentType: "dni",
    goodType: "producto",
    responseChannel: "email",
  };
  if (pedido !== undefined && pedido.length <= MAX_URL_ORDER_LENGTH) {
    const number = normalizeOrderNumber(pedido);
    if (ORDER_NUMBER_PATTERN.test(number)) values.orderNumber = number;
  }
  return initialFormState(values);
}
