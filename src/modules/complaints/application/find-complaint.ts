import {
  COMPLAINT_NUMBER_PATTERN,
  type ComplaintSheet,
} from "@/modules/complaints/domain/complaint";
import type { ComplaintRepository } from "./ports";

/**
 * The sheet whose secret access token matches (the constancia right after
 * filing, in the browser that filed it), or null. Numbers are correlative,
 * so knowing one is never enough.
 */
export async function findComplaintWithAccessToken(
  complaints: ComplaintRepository,
  number: string,
  accessToken: string,
): Promise<ComplaintSheet | null> {
  if (!COMPLAINT_NUMBER_PATTERN.test(number) || accessToken === "") return null;
  const sheet = await complaints.findByNumber(number);
  return sheet && sheet.accessToken === accessToken ? sheet : null;
}
