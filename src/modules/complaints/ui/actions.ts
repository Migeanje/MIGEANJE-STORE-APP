"use server";

import { redirect } from "next/navigation";
import { getUbigeoDirectory } from "@/modules/checkout/infrastructure";
import { CONTACT_MESSAGES } from "@/modules/checkout/ui/checkout-copy";
import {
  fieldErrorsOf,
  readFormValues,
} from "@/modules/checkout/ui/checkout-forms";
import {
  type FileComplaintResult,
  fileComplaint,
} from "@/modules/complaints/application/file-complaint";
import {
  getComplaintNotifier,
  getComplaintRepository,
} from "@/modules/complaints/infrastructure";
import { writeComplaintAccess } from "@/modules/complaints/infrastructure/complaint-access-cookie";
import { business } from "@/shared/config/business";
import { FILING_FAILURE } from "./complaint-copy";
import {
  COMPLAINT_FIELDS,
  type ComplaintFormState,
  complaintFormSchema,
} from "./complaint-form";
import { complaintReceiptPath } from "./complaint-paths";

/*
 * Server action of the Libro de Reclamaciones. The server validates the
 * Hoja with the same schema as the client (authoritative), files it under
 * the next correlative number, sends the copy and redirects to the
 * constancia (303 after the post, so it also works without JavaScript).
 */

/**
 * Files a Hoja de Reclamación. With `intent=ubigeo` (the no-JavaScript
 * "update" button) it only answers the values back, dropping a provincia or
 * distrito that no longer belongs to the selected parent.
 */
export async function fileComplaintAction(
  previous: ComplaintFormState,
  formData: FormData,
): Promise<ComplaintFormState> {
  const values = readFormValues(formData, COMPLAINT_FIELDS);

  if (formData.get("intent") === "ubigeo") {
    const provincia =
      values.departamento !== "" &&
      values.provincia.startsWith(values.departamento)
        ? values.provincia
        : "";
    const distrito =
      provincia !== "" && values.distrito.startsWith(provincia)
        ? values.distrito
        : "";
    return {
      values: { ...values, provincia, distrito },
      errors: {},
      formError: null,
      attempt: previous.attempt,
    };
  }

  const attempt = previous.attempt + 1;
  const parsed = complaintFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      values,
      errors: fieldErrorsOf(parsed.error),
      formError: null,
      attempt,
    };
  }

  let result: FileComplaintResult;
  try {
    result = await fileComplaint(
      {
        complaints: getComplaintRepository(),
        notifier: getComplaintNotifier(),
        ubigeo: getUbigeoDirectory(),
        provider: business,
      },
      parsed.data,
    );
  } catch (error) {
    // Nothing was filed: trying again is safe. The message only, never the
    // sheet (it carries personal data).
    console.error(
      "Filing a complaint failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return { values, errors: {}, formError: FILING_FAILURE, attempt };
  }

  if (!result.ok) {
    return {
      values,
      errors: { distrito: CONTACT_MESSAGES.ubigeoUnknown },
      formError: null,
      attempt,
    };
  }

  const { sheet } = result;
  if (result.copyFailure !== undefined) {
    // Filed, but the copy (or its record) failed: someone must resend it.
    // One structured event, without personal data.
    console.error(
      JSON.stringify({
        event:
          result.copy === "failed"
            ? "complaint_copy_failed"
            : "complaint_copy_not_recorded",
        complaintNumber: sheet.number,
        failure: result.copyFailure,
      }),
    );
  }
  await writeComplaintAccess(sheet);
  redirect(complaintReceiptPath(sheet.number));
}
