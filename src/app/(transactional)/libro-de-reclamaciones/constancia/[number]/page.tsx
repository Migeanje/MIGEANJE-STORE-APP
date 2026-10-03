import type { Metadata } from "next";
import { ComplaintReceiptContainer } from "@/modules/complaints/ui/complaint-receipt.container";

export const metadata: Metadata = {
  title: "Constancia de tu Hoja de Reclamación",
  robots: { index: false },
};

/**
 * The constancia right after filing a Hoja de Reclamación, only for the
 * browser that filed it (access cookie, one hour). Print-friendly.
 */
export default async function ComplaintReceiptPage({
  params,
}: PageProps<"/libro-de-reclamaciones/constancia/[number]">) {
  const { number } = await params;
  return <ComplaintReceiptContainer number={number} />;
}
