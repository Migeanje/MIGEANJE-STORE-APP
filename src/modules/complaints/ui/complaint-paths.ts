/** The virtual Libro de Reclamaciones (linked from the footer on every page). */
export const COMPLAINT_BOOK_PATH = "/libro-de-reclamaciones";

/** The constancia of a sheet, right after filing it. */
export function complaintReceiptPath(number: string): string {
  return `${COMPLAINT_BOOK_PATH}/constancia/${encodeURIComponent(number)}`;
}
