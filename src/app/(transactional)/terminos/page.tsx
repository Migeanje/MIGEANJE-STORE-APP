import type { Metadata } from "next";
import Link from "next/link";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import { DescriptionList } from "@/shared/ui/molecules/description-list";
import { LegalPage, type LegalSection } from "@/shared/ui/templates/legal-page";
import {
  contactEmailText,
  LEGAL_DRAFT_NOTE,
  LEGAL_PATHS,
  LEGAL_UPDATED_AT,
  relatedLinks,
  storeIdentityItems,
} from "../_legal/legal";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Términos y condiciones",
    description:
      "Las reglas de compra en Migeanje Store: precios en soles con impuestos, pagos, boletas, productos en importación, cancelaciones, garantías y reclamos.",
  };
}

// DRAFT: legal sources checked on 2026-10-03 (Engram `legal/trust-pages`):
// Ley 29571 arts. 4.1–4.2 (total price with taxes; transport informed
// before paying), 24.1 (Ley 31435: 15 business days), 150 (Libro de
// Reclamaciones). Store policies (cancellations) are proposals.
const SECTIONS: LegalSection[] = [
  {
    id: "quienes-somos",
    title: "Quiénes somos",
    content: (
      <>
        <Text>
          Migeanje Store es una tienda en línea de accesorios de tecnología que
          vende y entrega en el Perú. Estos son nuestros datos:
        </Text>
        <DescriptionList items={storeIdentityItems()} columns={2} />
        <Text>
          Somos una tienda independiente: vendemos productos de marcas como
          Anker, UGREEN, Soundcore y Apple, pero no las representamos ni estamos
          afiliados a ellas. Usamos sus nombres solo para describir lo que
          vendemos.
        </Text>
      </>
    ),
  },
  {
    id: "aceptacion",
    title: "Cuándo se aplican estos términos",
    content: (
      <>
        <Text>
          Estos términos se aplican a las compras que haces en nuestra tienda en
          línea. Antes de pagar te pedimos que los aceptes. Se aplica la versión
          publicada el día de tu compra; si los cambiamos, la nueva versión vale
          solo para compras posteriores.
        </Text>
        <Text>
          También forman parte de estos términos nuestras páginas de{" "}
          <Link href={LEGAL_PATHS.shipping}>envíos y devoluciones</Link>,{" "}
          <Link href={LEGAL_PATHS.warranty}>garantías</Link> y{" "}
          <Link href={LEGAL_PATHS.privacy}>privacidad</Link>.
        </Text>
      </>
    ),
  },
  {
    id: "precios-y-pagos",
    title: "Precios y pagos",
    content: (
      <ul>
        <li>
          Los precios están en soles (S/) e incluyen los impuestos. El precio
          que ves es el total que pagas por el producto.
        </li>
        <li>
          El costo de envío depende de tu dirección: lo ves y se suma al total
          antes de pagar, nunca después.
        </li>
        <li>
          Pagas con tarjeta de crédito o débito a través de Culqi, nuestro
          procesador de pagos. Los datos de tu tarjeta van al procesador: no los
          guardamos.
        </li>
        <li>
          Mientras la tienda esté en modo demostración, los pagos son simulados:
          no se hace ningún cargo real.
        </li>
      </ul>
    ),
  },
  {
    id: "comprobantes",
    title: "Comprobantes de pago",
    content: (
      <Text>
        Por cada compra emitimos una boleta de venta electrónica a nombre de
        quien compra, con su DNI o carné de extranjería, y te la enviamos por
        correo. Por ahora no emitimos facturas: te avisaremos cuando podamos
        hacerlo.
      </Text>
    ),
  },
  {
    id: "disponibilidad",
    title: "Disponibilidad y productos en importación",
    content: (
      <>
        <Text>Cada producto muestra su disponibilidad antes de comprar:</Text>
        <ul>
          <li>
            <strong>En stock:</strong> lo tenemos en el Perú y lo preparamos
            apenas confirmamos tu pago.
          </li>
          <li>
            <strong>En importación:</strong> lo pedimos para ti apenas
            confirmamos tu pago. Su plazo (normalmente de 15 a 20 días hábiles)
            se muestra en el producto, en el carrito y antes de pagar, y ya está
            incluido en la fecha estimada de entrega.
          </li>
          <li>
            <strong>Agotado:</strong> no se puede comprar; puedes pedir que te
            avisemos cuando vuelva.
          </li>
        </ul>
        <Text>
          Puedes llevar hasta 5 unidades de cada producto en stock y hasta 2 de
          cada producto en importación por pedido. Si tu pedido mezcla productos
          en stock y en importación, lo enviamos completo cuando todo esté
          disponible.
        </Text>
      </>
    ),
  },
  {
    id: "confirmacion",
    title: "Cómo se confirma tu pedido",
    content: (
      <>
        <Text>
          Justo antes de cobrar, volvemos a revisar el precio, la disponibilidad
          y el costo de envío de tu pedido. Si algo cambió, te mostramos el
          nuevo total y no cobramos nada hasta que lo revises y vuelvas a pagar.
        </Text>
        <Text>
          Tu pedido queda confirmado cuando el pago se aprueba: te mostramos tu
          número de pedido (por ejemplo, MG-2026-004521) y te lo enviamos por
          correo. Con ese número y tu correo puedes{" "}
          <Link href={LEGAL_PATHS.tracking}>seguir tu pedido</Link>.
        </Text>
      </>
    ),
  },
  {
    id: "cancelaciones",
    title: "Cancelaciones",
    content: (
      <>
        <Text>
          Propuesta de política de la tienda, por confirmar antes del
          lanzamiento:
        </Text>
        <ul>
          <li>
            Puedes cancelar tu pedido sin costo mientras no haya salido a
            reparto. Escríbenos a {contactEmailText()} con tu número de pedido.
          </li>
          <li>
            Si tu pedido incluye productos en importación, puedes cancelarlos
            sin costo hasta que hagamos el pedido al proveedor; te diremos si
            todavía es posible cuando respondamos tu mensaje.
          </li>
          <li>
            Devolvemos el importe a la misma tarjeta con la que pagaste. Lo que
            tarda en verse depende de tu banco.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "envios-garantias-devoluciones",
    title: "Envíos, garantías y devoluciones",
    content: (
      <Text>
        Los costos, plazos y entregas están en{" "}
        <Link href={LEGAL_PATHS.shipping}>Envíos y devoluciones</Link>, junto
        con nuestra política de cambios. Lo que puedes pedir si un producto
        falla está en <Link href={LEGAL_PATHS.warranty}>Garantías</Link>.
      </Text>
    ),
  },
  {
    id: "reclamos",
    title: "Reclamos y quejas",
    content: (
      <>
        <Text>
          Puedes registrar un reclamo o una queja en nuestro{" "}
          <Link href={LEGAL_PATHS.complaints}>Libro de Reclamaciones</Link>{" "}
          virtual, disponible en el pie de cada página. Te enviamos una copia a
          tu correo y te respondemos en un plazo máximo de 15 días hábiles.
        </Text>
        <Text>
          Registrar un reclamo no te impide acudir a otras vías de solución ni
          es requisito para presentar una denuncia ante el Indecopi.
        </Text>
      </>
    ),
  },
  {
    id: "datos-personales",
    title: "Tus datos personales",
    content: (
      <Text>
        Usamos tus datos para atender tu pedido, emitir tu comprobante y
        responder tus reclamos. Te contamos qué datos usamos, con quién los
        compartimos y cómo ejercer tus derechos en nuestra{" "}
        <Link href={LEGAL_PATHS.privacy}>Política de privacidad</Link>.
      </Text>
    ),
  },
  {
    id: "ley-aplicable",
    title: "Ley aplicable",
    content: (
      <Text>
        Estos términos se rigen por las leyes del Perú, en especial por el
        Código de Protección y Defensa del Consumidor (Ley 29571). Nada en estos
        términos limita los derechos que esa ley te da.
      </Text>
    ),
  },
  {
    id: "contacto",
    title: "Contacto",
    content: (
      <>
        <Text>
          Escríbenos a {contactEmailText()} con tu número de pedido si lo
          tienes. Para un reclamo formal, usa el{" "}
          <Link href={LEGAL_PATHS.complaints}>Libro de Reclamaciones</Link>.
        </Text>
        <Heading level={3} className="text-body font-medium">
          Antes de abrir la tienda
        </Heading>
        <Text tone="muted">
          Completaremos la razón social, el RUC, el domicilio y el correo de
          atención el día en que tengamos el RUC de la tienda.
        </Text>
      </>
    ),
  },
];

/** /terminos: the terms of purchase (linked from the payment step). DRAFT. */
export default function TermsPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      intro="Las reglas de compra en Migeanje Store: qué pagas, cuándo llega tu pedido y qué puedes hacer si algo no sale bien."
      updatedAt={LEGAL_UPDATED_AT}
      draftNote={LEGAL_DRAFT_NOTE}
      sections={SECTIONS}
      related={relatedLinks("shipping", "warranty", "privacy", "complaints")}
    />
  );
}
