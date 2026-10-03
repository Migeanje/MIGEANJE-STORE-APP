/*
 * How customers reach the store, in code like `business.ts` so changing it
 * is a reviewed commit.
 *
 * DRAFT: `null` means "por definir". Fill in `email` before the store opens:
 * the privacy policy (ARCO rights), returns, warranties and the terms point
 * to it. The Libro de Reclamaciones stays the formal channel for claims.
 */
export type ContactChannels = {
  /** Customer service email (also for data protection requests). */
  readonly email: string | null;
};

export const contact: ContactChannels = {
  email: null,
};
