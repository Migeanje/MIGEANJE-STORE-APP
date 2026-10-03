import type { Metadata } from "next";
import Link from "next/link";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import { LegalPage, type LegalSection } from "@/shared/ui/templates/legal-page";
import {
  contactEmailText,
  LEGAL_DRAFT_NOTE,
  LEGAL_PATHS,
  LEGAL_UPDATED_AT,
  relatedLinks,
} from "../_legal/legal";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Garantías",
    description:
      "Tu garantía legal según el Código de Protección y Defensa del Consumidor, la garantía del fabricante y cómo pedir una reparación, un cambio o la devolución de tu dinero.",
  };
}

// DRAFT: sources checked on 2026-10-03 (Engram `legal/trust-pages`): Ley
// 29571 arts. 18 (idoneidad), 19 (the provider answers for it), 20 (legal,
// explicit and implicit warranties), 21.1, 97 (repair, replacement or
// refund; a voluntary warranty never limits legal rights); Apple's LATAM
// accessory warranty (1 year). Anker, Soundcore and UGREEN publish their
// durations only for other countries: no duration is stated for them.
const SECTIONS: LegalSection[] = [
  {
    id: "garantia-legal",
    title: "Tu garantía legal",
    content: (
      <>
        <Text>
          El Código de Protección y Defensa del Consumidor (Ley 29571) te
          protege en cada compra, aunque el producto no traiga ninguna garantía
          escrita. Lo que recibes debe corresponder a lo que te ofrecimos y a lo
          que razonablemente esperas de ese producto: a eso la ley lo llama
          idoneidad, y como tienda respondemos por ella.
        </Text>
        <Text>La ley reconoce tres tipos de garantía:</Text>
        <ul>
          <li>
            <strong>Legal:</strong> lo que la ley o las normas exigen para que
            un producto se pueda vender. No se puede pactar en contra.
          </li>
          <li>
            <strong>Explícita:</strong> lo que ofrecemos expresamente, por
            ejemplo en la ficha del producto, en la publicidad, en la caja o en
            el comprobante.
          </li>
          <li>
            <strong>Implícita:</strong> si no se dijo nada, el producto debe
            servir para los fines y usos previsibles para los que lo compraste.
            Por ejemplo, un cargador debe cargar los equipos compatibles con la
            potencia que indica.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "que-puedes-pedir",
    title: "Qué puedes pedir si un producto falla",
    content: (
      <>
        <Text>
          Si el producto tiene una falla de fabricación, un defecto oculto o no
          es lo que te ofrecimos, según el caso puedes pedir:
        </Text>
        <ul>
          <li>que lo reparemos,</li>
          <li>que lo cambiemos por uno igual (reposición), o</li>
          <li>que te devolvamos lo que pagaste.</li>
        </ul>
        <Text>
          Te atendemos nosotros: no tienes que buscar al fabricante. Si la
          reparación no resuelve la falla, puedes pedir el cambio o la
          devolución.
        </Text>
      </>
    ),
  },
  {
    id: "fabricante",
    title: "Garantía del fabricante",
    content: (
      <>
        <Text>
          Algunos fabricantes ofrecen además su propia garantía. Es voluntaria y
          se suma a tu garantía legal: nunca la reemplaza ni la recorta.
        </Text>
        <ul>
          <li>
            <strong>Apple:</strong> los accesorios de la marca Apple tienen una
            garantía limitada de un año desde la compra, según la garantía de
            Apple para Latinoamérica.
          </li>
          <li>
            <strong>Anker, Soundcore y UGREEN:</strong> según el fabricante. Sus
            garantías publicadas suelen valer solo en el país donde se compró el
            producto, así que en el Perú gestionamos tu solicitud nosotros, con
            tu garantía legal.
          </li>
        </ul>
        <Text tone="muted">
          Indicaremos en cada producto la garantía del fabricante cuando la
          tengamos confirmada para el Perú.
        </Text>
      </>
    ),
  },
  {
    id: "como-solicitar",
    title: "Cómo pedir una garantía",
    content: (
      <>
        <ol>
          <li>
            Escríbenos a {contactEmailText()} con tu número de pedido, el
            producto y qué falla. Si puedes, agrega fotos o un video corto.
          </li>
          <li>
            Te respondemos con los pasos a seguir. Si tenemos que revisar el
            producto, te diremos cómo enviarlo; si la falla está cubierta, el
            envío corre por nuestra cuenta [política por confirmar].
          </li>
          <li>
            Revisamos el producto y te proponemos la reparación, el cambio o la
            devolución de tu dinero.
          </li>
        </ol>
        <Text>
          Si no estás de acuerdo con nuestra respuesta, o prefieres dejar
          constancia formal, registra tu reclamo en el{" "}
          <Link href={LEGAL_PATHS.complaints}>Libro de Reclamaciones</Link>: te
          respondemos en un plazo máximo de 15 días hábiles.
        </Text>
      </>
    ),
  },
  {
    id: "que-no-cubre",
    title: "Qué no cubre la garantía",
    content: (
      <>
        <ul>
          <li>Golpes, caídas, líquidos o daños por mal uso.</li>
          <li>
            Usar el producto con equipos, voltajes o accesorios que no son
            compatibles según sus especificaciones.
          </li>
          <li>Reparaciones o cambios hechos por terceros no autorizados.</li>
          <li>
            El desgaste normal por el uso, como la pérdida gradual de capacidad
            de una batería con el tiempo.
          </li>
        </ul>
        <Heading level={3} className="text-body font-medium">
          Lo que siempre se mantiene
        </Heading>
        <Text>
          Estas exclusiones no limitan tus derechos si el producto ya tenía una
          falla de fabricación o un defecto oculto, ni cuando no era lo que te
          ofrecimos.
        </Text>
      </>
    ),
  },
];

/** /garantias: legal and manufacturer warranties. DRAFT. */
export default function WarrantyPage() {
  return (
    <LegalPage
      title="Garantías"
      intro="Qué te asegura la ley en cada compra, qué ofrecen los fabricantes y cómo pedir una reparación, un cambio o la devolución de tu dinero."
      updatedAt={LEGAL_UPDATED_AT}
      draftNote={LEGAL_DRAFT_NOTE}
      sections={SECTIONS}
      related={relatedLinks("shipping", "complaints", "terms")}
    />
  );
}
