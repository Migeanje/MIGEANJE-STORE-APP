import type { ComplaintNotifier } from "@/modules/complaints/application/ports";
import type { ComplaintSheet } from "@/modules/complaints/domain/complaint";

/** A copy that would have been emailed to the consumer. */
export type OutboxMessage = {
  to: string;
  subject: string;
  complaintNumber: string;
  queuedAt: string;
  sheet: ComplaintSheet;
};

export type MockComplaintNotifier = ComplaintNotifier & {
  /** Every copy "sent", oldest first. */
  outbox(): Promise<OutboxMessage[]>;
};

export type MockComplaintNotifierOptions = {
  /** Where the one-line JSON event goes (the server log by default). */
  log?: (line: string) => void;
  now?: () => Date;
};

/**
 * ComplaintNotifier for `DATA_SOURCE=mock`: nothing leaves the server. Each
 * copy goes to an in-memory outbox (DEV ONLY, lost on restart) and one
 * structured log line records it with the complaint number and the email's
 * domain only: no names, documents, phone numbers or addresses in logs.
 */
export function createMockComplaintNotifier({
  log = (line) => console.info(line),
  now = () => new Date(),
}: MockComplaintNotifierOptions = {}): MockComplaintNotifier {
  const messages: OutboxMessage[] = [];
  return {
    async sendCopy(sheet) {
      const to = sheet.consumer.email;
      messages.push(
        structuredClone({
          to,
          subject: `Copia de tu Hoja de Reclamación ${sheet.number}`,
          complaintNumber: sheet.number,
          queuedAt: now().toISOString(),
          sheet,
        }),
      );
      log(
        JSON.stringify({
          event: "complaint_copy_sent",
          adapter: "mock",
          complaintNumber: sheet.number,
          kind: sheet.claim.kind,
          recipientDomain: to.slice(to.lastIndexOf("@") + 1),
        }),
      );
    },
    async outbox() {
      return structuredClone(messages);
    },
  };
}
