import {
  resolveUbigeo,
  type UbigeoCodes,
} from "@/modules/checkout/domain/ubigeo";
import {
  type Claim,
  type ComplaintConsumer,
  type ComplaintSheet,
  type ContractedGood,
  type NewComplaint,
  type ProviderIdentification,
  type ResponseChannel,
  responseDueDate,
} from "@/modules/complaints/domain/complaint";
import type {
  ComplaintNotifier,
  ComplaintRepository,
  UbigeoDirectory,
} from "./ports";

/** The Hoja as the form sends it: the ubigeo as codes only. */
export type FileComplaintInput = {
  consumer: Omit<ComplaintConsumer, "address"> & {
    address: { line: string; ubigeo: UbigeoCodes };
  };
  goods: ContractedGood;
  claim: Claim;
  responseChannel: ResponseChannel;
  declarationAccepted: true;
};

export type FileComplaintDeps = {
  complaints: ComplaintRepository;
  notifier: ComplaintNotifier;
  ubigeo: UbigeoDirectory;
  /** The store as it identifies itself on every sheet (DRAFT config). */
  provider: ProviderIdentification;
  now?: () => Date;
  newAccessToken?: () => string;
};

export type FileComplaintResult =
  | {
      ok: true;
      sheet: ComplaintSheet;
      /** Whether the copy reached the consumer's email. */
      copy: "sent" | "failed";
      /** Why the copy failed (an error message), for the server log. */
      copyFailure?: string;
    }
  | { ok: false; error: "unknown_ubigeo" };

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

/**
 * Files a Hoja de Reclamación: looks up the ubigeo names (a distrito of
 * another provincia is refused), dates it now, sets the answer's due date,
 * snapshots the provider, files it under the next correlative and sends the
 * consumer a copy right away. Input the form should have refused (e.g. an
 * empty detail) throws before anything is filed. Once filed, nothing throws:
 * a copy that cannot be sent leaves the sheet filed and answers
 * `copy: "failed"`, so filing again never duplicates a claim.
 */
export async function fileComplaint(
  services: FileComplaintDeps,
  input: FileComplaintInput,
): Promise<FileComplaintResult> {
  const now = services.now ?? (() => new Date());
  const newAccessToken = services.newAccessToken ?? (() => crypto.randomUUID());

  const ubigeo = resolveUbigeo(
    await services.ubigeo.tree(),
    input.consumer.address.ubigeo,
  );
  if (!ubigeo) return { ok: false, error: "unknown_ubigeo" };

  const filedAt = now();
  const complaint: NewComplaint = {
    accessToken: newAccessToken(),
    filedAt: filedAt.toISOString(),
    responseDueDate: responseDueDate(filedAt),
    provider: services.provider,
    consumer: {
      ...input.consumer,
      address: { line: input.consumer.address.line, ubigeo },
    },
    goods: input.goods,
    claim: input.claim,
    responseChannel: input.responseChannel,
    declarationAccepted: input.declarationAccepted,
    copySentAt: null,
  };
  const sheet = await services.complaints.file(complaint);

  try {
    await services.notifier.sendCopy(sheet);
  } catch (error) {
    return { ok: true, sheet, copy: "failed", copyFailure: messageOf(error) };
  }
  const copySentAt = now().toISOString();
  try {
    await services.complaints.markCopySent(sheet.number, copySentAt);
  } catch (error) {
    // The copy went out; only its record is missing. Still filed and sent.
    return {
      ok: true,
      sheet,
      copy: "sent",
      copyFailure: `copy sent but not recorded: ${messageOf(error)}`,
    };
  }
  return { ok: true, sheet: { ...sheet, copySentAt }, copy: "sent" };
}
