import { getUbigeoDirectory } from "@/modules/checkout/infrastructure";
import { isDemoComplaintBook } from "@/modules/complaints/infrastructure";
import { business } from "@/shared/config/business";
import { ComplaintBook } from "@/shared/ui/templates/complaint-book";
import { fileComplaintAction } from "./actions";
import { COMPLAINT_BOOK_COPY, LEGAL_NOTES } from "./complaint-copy";
import { complaintFormInitialState } from "./complaint-form";
import { ComplaintSheetForm } from "./complaint-sheet-form";
import { providerItems } from "./complaint-view";

/** Where the privacy policy will live (M9). */
const PRIVACY_PATH = "/privacidad";

/**
 * /libro-de-reclamaciones: the legal aviso, the provider's identification
 * (DRAFT config), the legal notes and the Hoja de Reclamación form, with
 * the order number from `?pedido=` prefilled when it is well-formed.
 */
export async function ComplaintBookContainer({ pedido }: { pedido?: string }) {
  const ubigeo = await getUbigeoDirectory().tree();
  return (
    <ComplaintBook
      notice={COMPLAINT_BOOK_COPY.notice}
      intro={COMPLAINT_BOOK_COPY.intro}
      provider={providerItems(business)}
      legalNotes={LEGAL_NOTES}
      demoNote={isDemoComplaintBook() ? COMPLAINT_BOOK_COPY.demo : undefined}
      form={
        <ComplaintSheetForm
          action={fileComplaintAction}
          initialState={complaintFormInitialState(pedido)}
          ubigeo={ubigeo}
          privacyHref={PRIVACY_PATH}
        />
      }
    />
  );
}
