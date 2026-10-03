// Customer-facing copy of the Libro de Reclamaciones (neutral Peruvian
// Spanish, "tú"). DRAFT: every text here is pending review by a lawyer.
//
// Legal sources (checked 2026-10-03):
// - Ley 29571, arts. 24.1 (Ley 31435: 15 business days, not extendable) and
//   150–151 (Ley 32495: e-commerce book, permanent visible link).
// - Reglamento del Libro de Reclamaciones, D.S. 011-2011-PCM as amended
//   (D.S. 006-2014-PCM: virtual book art. 4-B; D.S. 101-2022-PCM: queja
//   definition, arts. 6 and 6-B, current Anexo I).
// Texts quoted from Anexo I are marked "Anexo I (verbatim)": keep them as
// they are.
import type {
  ComplaintKind,
  GoodType,
  ResponseChannel,
} from "@/modules/complaints/domain/complaint";

export const COMPLAINT_BOOK_COPY = {
  title: "Libro de Reclamaciones",
  /** The aviso, adapted from the Reglamento's Anexo II for a web store. */
  notice:
    "Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, Migeanje Store cuenta con un Libro de Reclamaciones virtual a tu disposición.",
  intro:
    "Completa esta Hoja de Reclamación para registrar tu reclamo o queja. Al enviarla, te mostramos tu constancia para imprimir y te enviamos una copia a tu correo.",
  demo: "Modo demostración: no enviamos correos reales. La copia de tu Hoja queda en un buzón de pruebas del servidor y se borra al reiniciarlo.",
  formLabel: "Hoja de Reclamación",
} as const;

/** Anexo I (verbatim): the notes printed on every Hoja de Reclamación. */
export const LEGAL_NOTES = [
  "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.",
  "El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual es improrrogable.",
] as const;

/** Section titles of Anexo I (verbatim, in sentence case). */
export const SECTION_TITLES = {
  consumer: "1. Identificación del consumidor reclamante",
  goods: "2. Identificación del bien contratado",
  claim: "3. Detalle de la reclamación y pedido del consumidor",
  provider: "4. Observaciones y acciones adoptadas por el proveedor",
} as const;

export const KIND_LABELS: Record<ComplaintKind, string> = {
  reclamo: "Reclamo",
  queja: "Queja",
};

/** Anexo I (verbatim): the footnotes that define each kind. */
export const KIND_DEFINITIONS: Record<ComplaintKind, string> = {
  reclamo: "Disconformidad relacionada a los productos o servicios.",
  queja:
    "Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.",
};

export const GOOD_TYPE_LABELS: Record<GoodType, string> = {
  producto: "Producto",
  servicio: "Servicio",
};

export const RESPONSE_CHANNEL_LABELS: Record<ResponseChannel, string> = {
  email: "Por correo electrónico",
  carta: "Por carta a mi domicilio",
};

export const PROVIDER_LABELS = {
  tradeName: "Nombre comercial",
  legalName: "Razón social o nombre",
  ruc: "RUC",
  address: "Domicilio",
  pending: "Por definir",
} as const;

export const FIELD_LABELS = {
  firstName: "Nombres",
  lastName: "Apellidos",
  documentType: "Tipo de documento",
  documentNumber: "Número de documento",
  email: "Correo electrónico",
  emailHint:
    "Te enviamos aquí la copia de tu Hoja de Reclamación y, si así lo eliges, nuestra respuesta.",
  phone: "Teléfono (opcional)",
  phoneHint: "Celular o fijo, solo números.",
  addressLine: "Domicilio",
  addressHint: "Calle, número, interior o departamento.",
  ubigeoLegend: "Ubicación de tu domicilio",
  isMinor: "Soy menor de edad",
  isMinorHint:
    "Si eres menor de edad, escribe también los datos de tu madre, padre o representante.",
  guardianLegend: "Madre, padre o representante",
  guardianName: "Nombre completo",
  guardianAddress: "Domicilio (opcional)",
  guardianPhone: "Teléfono (opcional)",
  guardianEmail: "Correo electrónico (opcional)",
  goodType: "¿Sobre qué es tu reclamo o queja?",
  orderNumber: "Número de pedido (opcional)",
  orderNumberHint:
    "Si compraste en nuestra tienda, por ejemplo MG-2026-004521.",
  amount: "Monto reclamado (opcional)",
  amountHint: "En soles, por ejemplo 129.90.",
  goodDescription: "Descripción (opcional)",
  goodDescriptionHint:
    "Qué producto o servicio es, por ejemplo: cargador de 100 W, color negro.",
  kind: "Tipo",
  detail: "Detalle",
  detailHint: "Cuéntanos qué pasó, con fechas si las tienes.",
  request: "Pedido (opcional)",
  requestHint: "Qué solución esperas de nosotros.",
  responseChannel: "¿Cómo quieres recibir nuestra respuesta?",
  acceptDeclaration:
    "Declaro que los datos y los hechos que describo en esta Hoja de Reclamación son verdaderos.",
  submit: "Enviar Hoja de Reclamación",
  refreshUbigeo: "Actualizar provincias y distritos",
  refreshUbigeoHint:
    "Sin JavaScript, las listas no se filtran solas: elige tu departamento (y luego tu provincia) y pulsa «Actualizar provincias y distritos».",
  privacy:
    "Usamos tus datos solo para atender tu reclamo o queja y responderte, y los conservamos al menos dos años, como exige la ley.",
  privacyLink: "Política de privacidad",
} as const;

export const COMPLAINT_MESSAGES = {
  phoneInvalid: "Escribe solo los números de tu teléfono, de 6 a 15 dígitos.",
  addressRequired: "Escribe tu domicilio.",
  textTooLong: "Usa 150 caracteres como máximo.",
  guardianNameRequired: "Escribe el nombre de tu madre, padre o representante.",
  guardianNameTooLong: "Usa 120 caracteres como máximo.",
  goodTypeRequired: "Elige si es un producto o un servicio.",
  orderNumberInvalid:
    "Revisa el número de pedido: tiene la forma MG-2026-004521.",
  amountInvalid: "Escribe el monto en soles, por ejemplo 129.90.",
  descriptionTooLong: "Usa 500 caracteres como máximo.",
  kindRequired: "Elige si es un reclamo o una queja.",
  detailRequired: "Cuéntanos qué pasó.",
  detailTooLong: "Usa 4000 caracteres como máximo.",
  requestTooLong: "Usa 2000 caracteres como máximo.",
  responseChannelRequired: "Elige cómo quieres recibir nuestra respuesta.",
  declarationRequired:
    "Confirma que los datos y hechos son verdaderos para enviar tu Hoja.",
} as const;

export const FILING_FAILURE = {
  title: "No pudimos registrar tu Hoja de Reclamación",
  message:
    "Algo salió mal de nuestro lado y tu reclamo o queja no se registró. Espera un momento e inténtalo de nuevo.",
} as const;

/** The constancia shown right after filing. */
export const RECEIPT_COPY = {
  title: (kind: ComplaintKind) =>
    kind === "reclamo" ? "Registramos tu reclamo" : "Registramos tu queja",
  recipient: "Destinatario: consumidor (tu copia)",
  copySent: (email: string) =>
    `Te enviamos una copia de esta Hoja de Reclamación a ${email}.`,
  copyFailed:
    "No pudimos enviarte la copia por correo, pero tu Hoja de Reclamación sí quedó registrada. Imprímela o guárdala como PDF; te reenviaremos la copia.",
  due: (channel: ResponseChannel, dueDate: string) =>
    channel === "email"
      ? `Te responderemos por correo a más tardar el ${dueDate}.`
      : `Te responderemos por carta a tu domicilio a más tardar el ${dueDate}.`,
  terms: {
    name: "Nombre",
    document: "Documento",
    address: "Domicilio",
    phone: "Teléfono",
    email: "Correo electrónico",
    guardian: "Madre, padre o representante (menor de edad)",
    goodType: "Producto o servicio",
    orderNumber: "Número de pedido",
    amount: "Monto reclamado",
    description: "Descripción",
    kind: "Tipo",
    detail: "Detalle",
    request: "Pedido",
    responseChannel: "Respuesta",
    declaration: "Declaración",
    providerAnswer: "Observaciones y acciones adoptadas",
    due: "Plazo para responderte",
    responseDate: "Fecha de comunicación de la respuesta",
  },
  declaration:
    "Declaraste que los datos y los hechos descritos son verdaderos.",
  providerAnswerPending:
    "Pendiente. Aquí registraremos nuestra respuesta y la fecha en que te la comuniquemos.",
  responseDatePending: "Pendiente",
  dueText: (dueDate: string) =>
    `A más tardar el ${dueDate} (15 días hábiles, improrrogables).`,
  none: "No indicado",
  noAccess: {
    title: "No podemos mostrar esta constancia",
    message:
      "Por tu seguridad, la constancia solo se ve en el navegador desde el que enviaste tu Hoja de Reclamación, durante una hora. Revisa la copia que te enviamos a tu correo.",
    action: "Ir al Libro de Reclamaciones",
  },
} as const;
