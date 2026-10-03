import type { ComplaintRepository } from "@/modules/complaints/application/ports";
import {
  type ComplaintSheet,
  complaintSheetSchema,
  complaintYear,
  formatComplaintNumber,
  newComplaintSchema,
} from "@/modules/complaints/domain/complaint";

/**
 * ComplaintRepository over a Map, for `DATA_SOURCE=mock` and tests. Each
 * year (in Lima) has its own correlative. A sheet is validated before it
 * takes a number, and numbering and storing happen without an `await` in
 * between, so two filings never share a number and a refused sheet leaves
 * no gap. Sheets are deep-copied on every read and write.
 */
export function createInMemoryComplaintRepository(
  store: Map<string, ComplaintSheet> = new Map(),
): ComplaintRepository {
  const lastSequence = new Map<number, number>();
  return {
    async file(complaint) {
      const valid = newComplaintSchema.parse(complaint);
      const year = complaintYear(new Date(valid.filedAt));
      const sequence = (lastSequence.get(year) ?? 0) + 1;
      const sheet = complaintSheetSchema.parse({
        number: formatComplaintNumber(year, sequence),
        ...valid,
      });
      store.set(sheet.number, structuredClone(sheet));
      lastSequence.set(year, sequence);
      return structuredClone(sheet);
    },
    async markCopySent(number, sentAt) {
      const sheet = store.get(number);
      if (!sheet) throw new Error(`No complaint ${number} to mark as sent`);
      store.set(
        number,
        complaintSheetSchema.parse({ ...sheet, copySentAt: sentAt }),
      );
    },
    async findByNumber(number) {
      const sheet = store.get(number);
      return sheet ? structuredClone(sheet) : null;
    },
  };
}
