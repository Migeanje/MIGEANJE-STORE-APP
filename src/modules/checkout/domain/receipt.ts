import * as z from "zod";
import { isValidRuc } from "./customer";

/*
 * The comprobante de pago. Under the current tax regime (Nuevo RUS) the store
 * issues boletas only, to the customer's DNI or CE. Facturas (RUC, razón
 * social, fiscal address) are modelled for regime B and stay behind the
 * `factura` feature flag (src/shared/config/features.ts).
 */
export const RECEIPT_TYPES = ["boleta", "factura"] as const;
export type ReceiptType = (typeof RECEIPT_TYPES)[number];

export const receiptSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("boleta") }),
  z.strictObject({
    type: z.literal("factura"),
    ruc: z.string().refine(isValidRuc, { message: "Expected a valid RUC" }),
    /** Razón social as registered with SUNAT. */
    businessName: z.string().trim().min(1).max(150),
    fiscalAddress: z.string().trim().min(1).max(200),
  }),
]);

export type Receipt = z.infer<typeof receiptSchema>;
