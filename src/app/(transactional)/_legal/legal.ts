// Shared facts of the trust and legal pages (private folder: not a route).
// DRAFT: every legal text is pending a lawyer's review before launch.
import { providerItems } from "@/modules/complaints/ui/complaint-view";
import { business } from "@/shared/config/business";
import { contact } from "@/shared/config/contact";
import type { DescriptionListItem } from "@/shared/ui/molecules/description-list";
import type { LegalPageLink } from "@/shared/ui/templates/legal-page";

export const LEGAL_PATHS = {
  curation: "/como-elegimos",
  shipping: "/envios-y-devoluciones",
  warranty: "/garantias",
  terms: "/terminos",
  privacy: "/privacidad",
  complaints: "/libro-de-reclamaciones",
  tracking: "/pedidos/seguimiento",
} as const;

/** When these texts last changed (same day for every page in this version). */
export const LEGAL_UPDATED_AT = {
  label: "3 de octubre de 2026",
  dateTime: "2026-10-03",
} as const;

export const LEGAL_DRAFT_NOTE =
  "Es una propuesta para el lanzamiento de la tienda: puede cambiar y un abogado debe revisarla antes de que abramos. Las partes marcadas «por definir» dependen de datos que aún no tenemos.";

const PENDING = "Por definir";

/** The customer service email, or "por definir" until it exists. */
export function contactEmailText(): string {
  return contact.email ?? "nuestro correo de atención (por definir)";
}

/** Who the store is: the same items as the Libro de Reclamaciones, plus email. */
export function storeIdentityItems(): DescriptionListItem[] {
  return [
    ...providerItems(business),
    { term: "Correo de atención", details: contact.email ?? PENDING },
  ];
}

const RELATED: Record<keyof typeof LEGAL_PATHS, string> = {
  curation: "Cómo elegimos",
  shipping: "Envíos y devoluciones",
  warranty: "Garantías",
  terms: "Términos y condiciones",
  privacy: "Política de privacidad",
  complaints: "Libro de Reclamaciones",
  tracking: "Seguimiento de pedido",
};

/** "También te puede servir" links, in the given order. */
export function relatedLinks(
  ...pages: (keyof typeof LEGAL_PATHS)[]
): LegalPageLink[] {
  return pages.map((page) => ({
    href: LEGAL_PATHS[page],
    label: RELATED[page],
  }));
}
