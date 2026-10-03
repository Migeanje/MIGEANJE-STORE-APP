import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OrderConfirmation } from "./order-confirmation";

const meta = {
  title: "Templates/OrderConfirmation",
  component: OrderConfirmation,
  tags: ["autodocs"],
  args: {
    orderNumber: "MG-2026-004521",
    email: "ana@correo.pe",
    delivery: {
      title: "Llega entre el lunes 5 de octubre y el martes 6 de octubre",
      detail: "Envío a Lima Metropolitana · 24–48 h (días hábiles)",
    },
    receipt: "Boleta de venta electrónica · DNI 46027897",
    shippingAddress: [
      "Av. Larco 1234, dpto. 501",
      "Referencia: Frente al parque",
      "Miraflores, Lima, Lima",
    ],
    nextSteps: [
      "Confirmamos tu pago y preparamos tu pedido.",
      "Te avisamos por correo cuando salga a reparto.",
      "Recibes tu pedido en la dirección de entrega; ten a mano tu documento.",
    ],
    summary: {
      lines: [
        {
          key: "ANK-A2688",
          name: "Prime Charger 100W, 3 puertos",
          quantity: 2,
          lineTotal: 37980,
          availability: { status: "in_stock", label: "En stock" },
        },
      ],
      subtotal: 37980,
      shipping: 1000,
      shippingLabel: "Envío a Lima Metropolitana",
      total: 38980,
      notes: ["Precios incluyen impuestos."],
    },
    trackingHref: "/pedidos/seguimiento?numero=MG-2026-004521",
    continueHref: "/",
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The page right after paying: thanks, the order number in Geist Mono, the delivery estimate (with the backorder explanation when it applies), next steps, receipt and address, the order summary and links to tracking and the store.",
      },
    },
  },
} satisfies Meta<typeof OrderConfirmation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InStock: Story = { name: "In stock (Lima)" };

export const Backorder: Story = {
  name: "Backorder (Arequipa)",
  args: {
    delivery: {
      title:
        "Llega entre el miércoles 28 de octubre y el viernes 6 de noviembre",
      detail: "Envío a Arequipa · 18–25 días hábiles (15–20 de importación)",
    },
    backorderNote:
      "Tu pedido incluye productos en importación: los pedimos al proveedor apenas confirmamos tu pago y llegan en 15–20 días hábiles. Te lo enviamos completo cuando todo esté disponible; puedes seguir cada paso con tu número de pedido.",
    shippingAddress: ["Calle Mercaderes 210", "Cayma, Arequipa, Arequipa"],
    nextSteps: [
      "Confirmamos tu pago y pedimos tus productos en importación.",
      "Cuando lleguen tus productos en importación, preparamos tu pedido completo.",
      "Te avisamos por correo cuando salga a reparto.",
      "Recibes tu pedido en la dirección de entrega; ten a mano tu documento.",
    ],
    summary: {
      lines: [
        {
          key: "ANK-A121D-WHT",
          name: "Nano Charger 45W Smart Display",
          variantLabel: "Blanco",
          quantity: 1,
          lineTotal: 24890,
          availability: {
            status: "backorder",
            label: "En importación · llega en 15–20 días",
          },
        },
      ],
      subtotal: 24890,
      shipping: 2000,
      shippingLabel: "Envío a Arequipa",
      total: 26890,
      notes: ["Precios incluyen impuestos."],
    },
  },
};
