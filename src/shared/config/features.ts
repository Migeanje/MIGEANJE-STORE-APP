/*
 * Product feature flags: typed and in code, so turning one on is a reviewed
 * change with its own commit (and CI), not an environment variable.
 *
 * - `factura`: lets customers ask for a factura (RUC, razón social, fiscal
 *   address) at the "Comprobante" step. OFF while the store operates under
 *   Nuevo RUS, which issues boletas only. To turn it on, once the business
 *   moves to regime B (RER or RMT, chosen with the accountant): set
 *   `factura: true` below, check the factura copy with the accountant, run
 *   the checks and deploy. Server actions read this same value, so a
 *   factura cannot be submitted while it is off.
 */
export type Features = {
  readonly factura: boolean;
};

export const features: Features = {
  factura: false,
};
