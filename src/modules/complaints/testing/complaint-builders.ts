// Test-only builders for the complaints module. Never import from production code.
import type { FileComplaintInput } from "@/modules/complaints/application/file-complaint";
import type {
  ComplaintSheet,
  NewComplaint,
  ProviderIdentification,
} from "@/modules/complaints/domain/complaint";

export const COMPLAINT_ACCESS_TOKEN = "5d1c2b3a-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
/** Saturday 3 Oct 2026, 10:00 a.m. in Lima. */
export const FILED_AT = new Date("2026-10-03T15:00:00Z");
/** 15 business days after FILED_AT (weekends skipped). */
export const DUE_DATE = "2026-10-23";

export const A_PROVIDER: ProviderIdentification = {
  tradeName: "Migeanje Store",
  legalName: null,
  ruc: null,
  address: null,
};

/** A reclamo about a charger, filed by an adult in Miraflores. */
export function aNewComplaint(
  overrides: Partial<NewComplaint> = {},
): NewComplaint {
  return {
    accessToken: COMPLAINT_ACCESS_TOKEN,
    filedAt: FILED_AT.toISOString(),
    responseDueDate: DUE_DATE,
    provider: A_PROVIDER,
    consumer: {
      firstName: "Ana",
      lastName: "Pérez Quispe",
      document: { type: "dni", number: "46027897" },
      email: "ana@correo.pe",
      phone: "987654321",
      address: {
        line: "Av. Larco 1234, dpto. 501",
        ubigeo: {
          departamento: { code: "15", name: "Lima" },
          provincia: { code: "1501", name: "Lima" },
          distrito: { code: "150122", name: "Miraflores" },
        },
      },
      guardian: null,
    },
    goods: {
      type: "producto",
      orderNumber: "MG-2026-000123",
      amount: 18990,
      description: "Cargador Prime 100W, 3 puertos",
    },
    claim: {
      kind: "reclamo",
      detail: "El cargador dejó de funcionar a la semana de recibirlo.",
      request: "Cambio del producto por uno nuevo.",
    },
    responseChannel: "email",
    declarationAccepted: true,
    copySentAt: null,
    ...overrides,
  };
}

/** The same complaint once filed as 000000001-2026. */
export function aComplaintSheet(
  overrides: Partial<ComplaintSheet> = {},
): ComplaintSheet {
  return { number: "000000001-2026", ...aNewComplaint(), ...overrides };
}

/** What the form sends for `aNewComplaint` (ubigeo as codes only). */
export function aFileComplaintInput(
  overrides: Partial<FileComplaintInput> = {},
): FileComplaintInput {
  const { consumer, goods, claim, responseChannel } = aNewComplaint();
  return {
    consumer: {
      ...consumer,
      address: {
        line: consumer.address.line,
        ubigeo: { departamento: "15", provincia: "1501", distrito: "150122" },
      },
    },
    goods,
    claim,
    responseChannel,
    declarationAccepted: true,
    ...overrides,
  };
}
