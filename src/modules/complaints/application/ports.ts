import type { UbigeoDirectory } from "@/modules/checkout/application/ports";
import type {
  ComplaintSheet,
  NewComplaint,
} from "@/modules/complaints/domain/complaint";

export type { UbigeoDirectory };

/**
 * Port: the Libro de Reclamaciones itself, where filed sheets are kept (in
 * memory for `DATA_SOURCE=mock`; the backend in F3). Sheets are legal
 * records: never deleted, and only the copy's delivery is recorded later.
 */
export interface ComplaintRepository {
  /**
   * Files the complaint under the next correlative number of its year (in
   * Lima) and returns the stored sheet. Numbering and storing happen in one
   * step, so a failure leaves no gap in the correlative.
   */
  file(complaint: NewComplaint): Promise<ComplaintSheet>;
  /** Records when the copy reached the consumer's email. */
  markCopySent(number: string, sentAt: string): Promise<void>;
  /** The sheet with this exact number, or null. */
  findByNumber(number: string): Promise<ComplaintSheet | null>;
}

/**
 * Port: sends the consumer a copy of the filed sheet to their email right
 * after filing (a mock outbox now, a real email provider later).
 */
export interface ComplaintNotifier {
  sendCopy(sheet: ComplaintSheet): Promise<void>;
}
