import type { Metadata } from "next";
import { ComplaintBookContainer } from "@/modules/complaints/ui/complaint-book.container";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description:
    "Libro de Reclamaciones virtual de Migeanje Store: registra tu reclamo o queja y recibe una copia en tu correo.",
};

/**
 * The virtual Libro de Reclamaciones (linked from the footer on every
 * page). `?pedido=` (e.g. from order tracking) prefills a well-formed order
 * number, nothing else.
 */
export default async function ComplaintBookPage({
  searchParams,
}: PageProps<"/libro-de-reclamaciones">) {
  const { pedido } = await searchParams;
  return (
    <ComplaintBookContainer
      pedido={typeof pedido === "string" ? pedido : undefined}
    />
  );
}
