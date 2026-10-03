import Link from "next/link";
import { findComplaintWithAccessToken } from "@/modules/complaints/application/find-complaint";
import { getComplaintRepository } from "@/modules/complaints/infrastructure";
import { readComplaintAccess } from "@/modules/complaints/infrastructure/complaint-access-cookie";
import { Button } from "@/shared/ui/atoms/button";
import { EmptyState } from "@/shared/ui/molecules/empty-state";
import { ComplaintReceipt } from "@/shared/ui/templates/complaint-receipt";
import { RECEIPT_COPY } from "./complaint-copy";
import { COMPLAINT_BOOK_PATH } from "./complaint-paths";
import { complaintReceiptView } from "./complaint-view";

/** The sheet this browser filed in the last hour (its access cookie), or null. */
async function filedHere(number: string) {
  const access = await readComplaintAccess();
  if (!access || access.number !== number) return null;
  return findComplaintWithAccessToken(
    getComplaintRepository(),
    access.number,
    access.accessToken,
  );
}

/**
 * /libro-de-reclamaciones/constancia/[number]: the constancia, only for the
 * browser that filed the sheet (httpOnly cookie, one hour). Anyone else gets
 * the same neutral answer, so a correlative number reveals nothing.
 */
export async function ComplaintReceiptContainer({
  number,
}: {
  number: string;
}) {
  const sheet = await filedHere(number);
  if (sheet) return <ComplaintReceipt {...complaintReceiptView(sheet)} />;

  const { noAccess } = RECEIPT_COPY;
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8 lg:py-16">
      <EmptyState
        headingLevel={1}
        title={noAccess.title}
        description={noAccess.message}
      >
        <Button asChild size="lg">
          <Link href={COMPLAINT_BOOK_PATH}>{noAccess.action}</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
