/*
 * Who the store is, as it must identify itself to consumers (e.g. on every
 * Hoja de Reclamación: razón social or name, RUC and address). In code, like
 * the feature flags, so changing it is a reviewed commit.
 *
 * DRAFT: `null` means "por definir". The legal identity (persona natural with
 * RUC 10 for now, later a company with RUC 20) is pending: fill in
 * `legalName`, `ruc` and `address` the day the RUC is issued, before the
 * store opens. A virtual provider must have a RUC (Libro de Reclamaciones
 * regulation, art. 3.6).
 */
export type BusinessIdentity = {
  /** The name customers see. */
  readonly tradeName: string;
  /** Razón social, or the owner's full name for a persona natural. */
  readonly legalName: string | null;
  /** 11 digits starting with 10 or 20. */
  readonly ruc: string | null;
  /** Domicilio for consumer notices. */
  readonly address: string | null;
};

export const business: BusinessIdentity = {
  tradeName: "Migeanje Store",
  legalName: null,
  ruc: null,
  address: null,
};
