import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ComplaintReceipt } from "./complaint-receipt";

const meta = {
  title: "Templates/ComplaintReceipt",
  component: ComplaintReceipt,
  tags: ["autodocs"],
  args: {
    title: "Registramos tu reclamo",
    number: "000000001-2026",
    filedAt: {
      label: "3 oct. 2026, 10:00 a. m.",
      dateTime: "2026-10-03T15:00:00.000Z",
    },
    copy: {
      sent: true,
      text: "Te enviamos una copia de esta Hoja de Reclamación a ana@correo.pe.",
    },
    due: "Te responderemos por correo a más tardar el viernes 23 de octubre de 2026.",
    recipient: "Destinatario: consumidor (tu copia)",
    provider: [
      { term: "Nombre comercial", details: "Migeanje Store" },
      { term: "Razón social o nombre", details: "Por definir" },
      { term: "RUC", details: "Por definir" },
      { term: "Domicilio", details: "Por definir" },
    ],
    sections: [
      {
        title: "1. Identificación del consumidor reclamante",
        items: [
          { term: "Nombre", details: "Ana Pérez Quispe" },
          { term: "Documento", details: "DNI 46027897", mono: true },
          {
            term: "Domicilio",
            details: ["Av. Larco 1234, dpto. 501", "Miraflores, Lima, Lima"],
          },
          { term: "Teléfono", details: "987654321", mono: true },
          { term: "Correo electrónico", details: "ana@correo.pe" },
        ],
      },
      {
        title: "2. Identificación del bien contratado",
        items: [
          { term: "Tipo", details: "Producto" },
          { term: "Número de pedido", details: "MG-2026-000123", mono: true },
          { term: "Monto reclamado", details: "S/ 189.90" },
          { term: "Descripción", details: "Cargador Prime 100W, 3 puertos" },
        ],
      },
      {
        title: "3. Detalle de la reclamación y pedido del consumidor",
        items: [
          { term: "Tipo", details: "Reclamo" },
          {
            term: "Detalle",
            details:
              "El cargador dejó de funcionar a la semana de recibirlo.\nProbé con dos cables distintos.",
            preformatted: true,
          },
          {
            term: "Pedido",
            details: "Cambio del producto por uno nuevo.",
            preformatted: true,
          },
          { term: "Respuesta", details: "Por correo electrónico" },
        ],
      },
      {
        title: "4. Observaciones y acciones adoptadas por el proveedor",
        items: [
          {
            term: "Observaciones y acciones",
            details:
              "Pendiente. Aquí registraremos nuestra respuesta y la fecha en que te la comuniquemos.",
          },
          {
            term: "Fecha de comunicación de la respuesta",
            details: "Pendiente",
          },
        ],
      },
    ],
    legalNotes: [
      "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.",
      "El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual es improrrogable.",
    ],
    homeHref: "/",
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The constancia right after filing a Hoja de Reclamación: number (Geist Mono) and filing date and time, where the copy went (a status when it failed), the answer's due date, the provider and sections 1–4 of the sheet, the legal notes, and print/back actions. It prints with the paper theme of tokens.css; the actions never print.",
      },
    },
  },
} satisfies Meta<typeof ComplaintReceipt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CopySent: Story = { name: "Copy sent" };

export const CopyFailed: Story = {
  name: "Copy not sent",
  args: {
    copy: {
      sent: false,
      text: "No pudimos enviarte la copia por correo, pero tu Hoja de Reclamación sí quedó registrada. Imprímela o guárdala como PDF; te reenviaremos la copia.",
    },
  },
};
