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
    title: "Política de privacidad",
    description:
      "Qué datos personales usa Migeanje Store, para qué, con quién los comparte, cuánto tiempo los guarda y cómo ejercer tus derechos según la Ley 29733.",
  };
}

const ANPD_RIGHTS_URL =
  "https://www.gob.pe/9269-iniciar-procedimiento-para-el-ejercicio-de-derechos-de-acceso-rectificacion-cancelacion-y-oposicion";

// DRAFT: sources checked on 2026-10-03 (Engram `legal/trust-pages`): Ley
// 29733 art. 18 (information duties); Reglamento D.S. 016-2024-JUS (in force
// since 31-03-2025): art. 6.1 (what to inform), arts. 61 and 76 (rights),
// art. 69 (8/20/10 business days), art. 71 (one extension), arts. 88–91
// (tutela before the ANPD), art. 21.2 (cross-border flows), arts. 42–45
// (data bank registration), art. 26 (marketing consent), art. 34 (48 h
// breach notice); Libro de Reclamaciones Reglamento art. 12 (2 years).
const SECTIONS: LegalSection[] = [
  {
    id: "responsable",
    title: "Quién es responsable de tus datos",
    content: (
      <>
        <Text>
          Migeanje Store es responsable del banco de datos de clientes donde
          guardamos los datos que nos das al comprar o al registrar un reclamo:
        </Text>
        <DescriptionList items={storeIdentityItems()} columns={2} />
      </>
    ),
  },
  {
    id: "datos",
    title: "Qué datos usamos",
    content: (
      <ul>
        <li>
          <strong>Para tu pedido:</strong> nombres y apellidos, DNI o carné de
          extranjería, correo, celular, dirección de entrega con su distrito,
          provincia y departamento, los productos que compras y lo que pagas.
        </li>
        <li>
          <strong>Para el pago:</strong> los datos de tu tarjeta van
          directamente al procesador de pagos. No los guardamos, ni siquiera los
          últimos dígitos.
        </li>
        <li>
          <strong>Para un reclamo o queja:</strong> los datos de la Hoja de
          Reclamación (tu identificación, domicilio, correo, el detalle y tu
          pedido) y, si eres menor de edad, el nombre de tu padre, madre o
          representante.
        </li>
        <li>
          <strong>Para consultar un pedido:</strong> el número de pedido y tu
          correo, solo para buscarlo (no los guardamos aparte) y un
          identificador anónimo de tu navegador para limitar los intentos
          fallidos.
        </li>
      </ul>
    ),
  },
  {
    id: "finalidades",
    title: "Para qué los usamos",
    content: (
      <>
        <ul>
          <li>Procesar, preparar y entregar tu pedido.</li>
          <li>Emitir tu boleta de venta electrónica.</li>
          <li>
            Escribirte sobre tu pedido: confirmación, importación, reparto y
            entrega.
          </li>
          <li>Atender tus reclamos, quejas y solicitudes de garantía.</li>
          <li>
            Proteger la tienda y a ti: por ejemplo, pausar consultas después de
            muchos intentos fallidos.
          </li>
        </ul>
        <Text>
          Solo te enviaremos novedades y ofertas si nos das tu permiso por
          separado, marcando tú mismo una casilla que no viene marcada. Comprar
          no depende de ese permiso y puedes retirarlo cuando quieras, con un
          paso tan simple como el que usaste para darlo. Hoy no enviamos
          publicidad.
        </Text>
      </>
    ),
  },
  {
    id: "bases",
    title: "Por qué podemos usarlos",
    content: (
      <ul>
        <li>
          Los datos de tu pedido son necesarios para celebrar y cumplir la
          compra que nos pides [verificar base legal en la Ley 29733 con el
          abogado].
        </li>
        <li>
          Emitir comprobantes y llevar el Libro de Reclamaciones son
          obligaciones legales de la tienda.
        </li>
        <li>Las comunicaciones comerciales, solo con tu consentimiento.</li>
      </ul>
    ),
  },
  {
    id: "destinatarios",
    title: "Con quién los compartimos",
    content: (
      <>
        <Text>
          No vendemos tus datos. Solo los compartimos con quienes nos ayudan a
          atender tu compra, y solo lo necesario:
        </Text>
        <ul>
          <li>
            <strong>Procesador de pagos (Culqi):</strong> los datos del pago. En
            el modo demostración de la tienda no se envía nada.
          </li>
          <li>
            <strong>Empresa de reparto:</strong> tu nombre, dirección y celular
            para entregarte el pedido [empresa por definir].
          </li>
          <li>
            <strong>Proveedor de correo electrónico:</strong> tu correo para
            enviarte la confirmación y las novedades de tu pedido [proveedor por
            definir].
          </li>
          <li>
            <strong>Facturación electrónica:</strong> los datos de tu boleta,
            que se informan a la SUNAT [proveedor por definir].
          </li>
          <li>
            <strong>Autoridades:</strong> el Indecopi u otra autoridad cuando la
            ley lo exige, por ejemplo al revisar un reclamo.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "transferencias",
    title: "Datos fuera del Perú",
    content: (
      <Text>
        Algunos proveedores (por ejemplo, el alojamiento de la tienda o el
        correo electrónico) pueden guardar datos fuera del Perú. Solo usaremos
        proveedores que ofrezcan un nivel adecuado de protección o las garantías
        que pide la ley, y comunicaremos esas transferencias a la Autoridad
        Nacional de Protección de Datos Personales. La lista de proveedores y
        países está por definir.
      </Text>
    ),
  },
  {
    id: "conservacion",
    title: "Cuánto tiempo los guardamos",
    content: (
      <ul>
        <li>
          Pedidos y comprobantes: el tiempo que exigen las normas tributarias y
          de protección al consumidor [plazo por confirmar con el contador].
        </li>
        <li>
          Hojas de reclamación y sus respuestas: al menos 2 años, como exige el
          reglamento del Libro de Reclamaciones.
        </li>
        <li>Permiso para comunicaciones comerciales: hasta que lo retires.</li>
        <li>
          Identificador anónimo para limitar intentos: 1 día en tu navegador; el
          conteo de intentos se borra a los 15 minutos.
        </li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "Cookies y datos en tu navegador",
    content: (
      <>
        <Text>
          Solo usamos cookies propias y necesarias para que la tienda funcione.
          No usamos cookies de publicidad ni de analítica.
        </Text>
        <ul>
          <li>
            <code className="font-mono text-body-sm">mg_cart</code>: recuerda tu
            carrito. Dura 30 días desde tu último cambio.
          </li>
          <li>
            <code className="font-mono text-body-sm">mg_order</code>: te deja
            ver tu pedido después de pagar o de consultarlo. Dura 1 hora.
          </li>
          <li>
            <code className="font-mono text-body-sm">mg_complaint</code>: te
            deja ver la constancia de tu reclamo. Dura 1 hora.
          </li>
          <li>
            <code className="font-mono text-body-sm">mg_client</code>: un
            identificador anónimo para limitar los intentos fallidos al
            consultar pedidos. Dura 1 día.
          </li>
          <li>
            <code className="font-mono text-body-sm">migeanje:comparar</code>{" "}
            (almacenamiento local, no es una cookie): los productos que eliges
            para comparar. Se queda en tu navegador hasta que lo vacíes y no nos
            llega.
          </li>
        </ul>
        <Text>
          Las cookies no son accesibles desde el código de la página (httpOnly)
          y, en la tienda publicada, solo viajan por conexiones seguras.
        </Text>
      </>
    ),
  },
  {
    id: "derechos",
    title: "Tus derechos y cómo ejercerlos",
    content: (
      <>
        <Text>
          Puedes pedirnos información sobre el uso de tus datos y acceder a
          ellos, rectificarlos, cancelarlos (suprimirlos) u oponerte a su uso.
          También tienes derecho a un tratamiento objetivo y a la portabilidad.
        </Text>
        <Text>
          Escríbenos a {contactEmailText()} con tu nombre, un documento que te
          identifique, lo que pides y un correo para responderte. No cobramos
          nada. Te respondemos en estos plazos máximos de días hábiles:
        </Text>
        <ul>
          <li>Información: 8 días hábiles.</li>
          <li>Acceso: 20 días hábiles.</li>
          <li>Rectificación, cancelación u oposición: 10 días hábiles.</li>
        </ul>
        <Text>
          Si necesitamos más tiempo, te lo diremos dentro del plazo, y solo
          podremos ampliarlo una vez. Si no respondemos a tiempo o no estás de
          acuerdo con la respuesta, puedes presentar una reclamación ante la
          Autoridad Nacional de Protección de Datos Personales (procedimiento
          trilateral de tutela,{" "}
          <a href={ANPD_RIGHTS_URL} rel="noreferrer" target="_blank">
            gob.pe<span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
          ).
        </Text>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "Cómo protegemos tus datos",
    content: (
      <>
        <ul>
          <li>No guardamos los datos de tu tarjeta.</li>
          <li>
            Las páginas públicas de seguimiento ocultan parte de tus datos
            (nombre, dirección y correo).
          </li>
          <li>
            Solo las personas que atienden tu pedido o tu reclamo pueden ver tus
            datos completos.
          </li>
        </ul>
        <Text>
          Si ocurriera un incidente de seguridad que te afecte, te avisaremos y
          lo informaremos a la Autoridad Nacional de Protección de Datos
          Personales en un plazo máximo de 48 horas cuando la ley lo exija.
        </Text>
      </>
    ),
  },
  {
    id: "registro",
    title: "Registro de nuestro banco de datos",
    content: (
      <Text>
        Antes de abrir la tienda inscribiremos nuestro banco de datos de
        clientes en el Registro Nacional de Protección de Datos Personales. La
        inscripción está pendiente: te indicaremos aquí su código cuando la
        tengamos.
      </Text>
    ),
  },
  {
    id: "cambios",
    title: "Cambios a esta política",
    content: (
      <>
        <Text>
          Si cambiamos esta política, publicaremos la nueva versión con su
          fecha. Si el cambio afecta cómo usamos datos que ya nos diste, te
          avisaremos por correo antes de aplicarlo.
        </Text>
        <Heading level={3} className="text-body font-medium">
          Otras páginas
        </Heading>
        <Text>
          Las reglas de compra están en los{" "}
          <Link href={LEGAL_PATHS.terms}>Términos y condiciones</Link>.
        </Text>
      </>
    ),
  },
];

/** /privacidad: the privacy policy (Ley 29733). DRAFT. */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      intro="Qué datos personales usamos, para qué, con quién los compartimos y cómo ejercer tus derechos según la Ley de Protección de Datos Personales (Ley 29733) y su reglamento."
      updatedAt={LEGAL_UPDATED_AT}
      draftNote={LEGAL_DRAFT_NOTE}
      sections={SECTIONS}
      related={relatedLinks("terms", "complaints")}
    />
  );
}
