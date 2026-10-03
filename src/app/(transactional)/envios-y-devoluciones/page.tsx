import type { Metadata } from "next";
import Link from "next/link";
import { shippingRateRows } from "@/modules/checkout/ui/shipping-policy";
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
    title: "Envíos y devoluciones",
    description:
      "Costos y plazos de envío a Lima, Callao y el resto del Perú, productos en importación, seguimiento, entregas y nuestra política de cambios, devoluciones y reembolsos.",
  };
}

// DRAFT: sources checked on 2026-10-03 (Engram `legal/trust-pages`): Ley
// 29571 art. 4.2 (transport cost informed and accepted before paying), arts.
// 58–59 (7 calendar days of restitution only after aggressive or deceptive
// practices: no general withdrawal right online), Indecopi 16-06-2026
// (requiring sealed products with all packaging is disproportionate). The
// return window, refund timing and failed delivery rules are store
// proposals. Rates come from the checkout (`shippingRateRows`).
function sections(): LegalSection[] {
  return [
    {
      id: "costos-y-plazos",
      title: "Costos y plazos de envío",
      content: (
        <>
          <Text>
            Enviamos a todo el Perú. El costo depende de tu dirección y lo ves
            antes de pagar; pagas un solo envío por pedido.
          </Text>
          <table>
            <caption>Costo y tiempo del courier por zona (propuesta)</caption>
            <thead>
              <tr>
                <th scope="col">Zona</th>
                <th scope="col">Costo</th>
                <th scope="col">Tiempo de entrega</th>
              </tr>
            </thead>
            <tbody>
              {shippingRateRows().map((row) => (
                <tr key={row.zone}>
                  <th scope="row">{row.name}</th>
                  <td className="font-mono whitespace-nowrap">{row.price}</td>
                  <td>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Text>
            Contamos días hábiles, de lunes a viernes, desde que confirmamos tu
            pago. Los feriados pueden sumar un día. Lima Metropolitana es la
            provincia de Lima; el Callao tiene su propia tarifa.
          </Text>
        </>
      ),
    },
    {
      id: "en-importacion",
      title: "Productos en importación",
      content: (
        <>
          <Text>
            Los productos «En importación» no están en nuestro almacén: los
            pedimos al proveedor apenas confirmamos tu pago y los traemos al
            Perú. La importación suele tomar de 15 a 20 días hábiles y se suma
            al tiempo de envío; el plazo exacto se muestra en cada producto y
            antes de pagar.
          </Text>
          <Text>
            El costo de envío es el mismo. Si tu pedido mezcla productos en
            stock y en importación, lo enviamos completo cuando todo esté
            disponible.
          </Text>
        </>
      ),
    },
    {
      id: "seguimiento",
      title: "Seguimiento de tu pedido",
      content: (
        <Text>
          Te escribimos a tu correo en cada paso: pago confirmado, importación,
          preparación, salida a reparto y entrega. Cuando quieras, consulta el
          estado con tu número de pedido y tu correo en{" "}
          <Link href={LEGAL_PATHS.tracking}>Seguimiento de pedido</Link>.
        </Text>
      ),
    },
    {
      id: "entrega",
      title: "Entrega",
      content: (
        <>
          <Text>
            Entregamos en la dirección que indicaste. Ten a mano tu documento de
            identidad; si no vas a estar, una persona mayor de edad puede
            recibirlo por ti [por confirmar con el courier].
          </Text>
          <Heading level={3} className="text-body font-medium">
            Si no pudimos entregarlo
          </Heading>
          <Text>
            Propuesta: el courier intenta la entrega hasta dos veces [por
            confirmar]. Si no lo logra, te escribimos para coordinar. Si el
            pedido vuelve a nosotros por una dirección incorrecta o porque nadie
            lo recibió, el nuevo envío tiene el costo de la tarifa de tu zona.
          </Text>
          <Heading level={3} className="text-body font-medium">
            Si el paquete llega dañado
          </Heading>
          <Text>
            Toma fotos del paquete y del producto y escríbenos a{" "}
            {contactEmailText()} con tu número de pedido. Lo resolvemos como una
            garantía: cambio o devolución de tu dinero.
          </Text>
        </>
      ),
    },
    {
      id: "devoluciones",
      title: "Cambios y devoluciones",
      content: (
        <>
          <Heading level={3} className="text-body font-medium">
            Lo que dice la ley
          </Heading>
          <Text>
            En el Perú no existe un derecho general a devolver una compra por
            internet solo porque cambiaste de opinión. El Código de Protección y
            Defensa del Consumidor da 7 días calendario para devolver una compra
            cuando el vendedor usó métodos comerciales agresivos o engañosos. Si
            el producto falla o no es lo que te ofrecimos, tienes tu{" "}
            <Link href={LEGAL_PATHS.warranty}>garantía legal</Link> en cualquier
            caso.
          </Text>
          <Heading level={3} className="text-body font-medium">
            Nuestra política (propuesta)
          </Heading>
          <ul>
            <li>
              Puedes devolver o cambiar un producto dentro de los 7 días
              calendario desde que lo recibes, aunque solo hayas cambiado de
              opinión.
            </li>
            <li>
              Debe estar sin uso, completo y con sus accesorios. Puedes abrir la
              caja para revisarlo: no te pediremos que venga sellado.
            </li>
            <li>
              Si solo cambiaste de opinión, el envío de vuelta corre por tu
              cuenta. Si el producto falla o no es lo que pediste, lo pagamos
              nosotros.
            </li>
            <li>
              Los productos en importación siguen la misma política [por
              confirmar].
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "reembolsos",
      title: "Reembolsos",
      content: (
        <Text>
          Devolvemos el dinero a la misma tarjeta con la que pagaste. Iniciamos
          el reembolso dentro de los 5 días hábiles después de recibir y revisar
          el producto [plazo por confirmar]; lo que tarde en verse en tu estado
          de cuenta depende de tu banco. Si devuelves todo el pedido antes de
          que salga a reparto, también te devolvemos el envío.
        </Text>
      ),
    },
    {
      id: "como-solicitar",
      title: "Cómo pedir un cambio o una devolución",
      content: (
        <>
          <ol>
            <li>
              Escríbenos a {contactEmailText()} con tu número de pedido, el
              producto y el motivo.
            </li>
            <li>Te respondemos con cómo y dónde enviar el producto.</li>
            <li>
              Cuando lo recibimos y revisamos, hacemos el cambio o iniciamos tu
              reembolso.
            </li>
          </ol>
          <Text>
            Si tienes un problema con tu pedido y no lo resolvemos, registra tu
            reclamo en el{" "}
            <Link href={LEGAL_PATHS.complaints}>Libro de Reclamaciones</Link>:
            te respondemos en un plazo máximo de 15 días hábiles.
          </Text>
        </>
      ),
    },
  ];
}

/** /envios-y-devoluciones: shipping, delivery, returns and refunds. DRAFT. */
export default function ShippingAndReturnsPage() {
  return (
    <LegalPage
      title="Envíos y devoluciones"
      intro="Cuánto cuesta el envío, cuándo llega tu pedido y qué hacer si quieres cambiar o devolver un producto."
      updatedAt={LEGAL_UPDATED_AT}
      draftNote={LEGAL_DRAFT_NOTE}
      sections={sections()}
      related={relatedLinks("warranty", "tracking", "complaints", "terms")}
    />
  );
}
