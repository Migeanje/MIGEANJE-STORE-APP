import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { FormField } from "@/shared/ui/molecules/form-field";
import { OrderTracking, type TrackedOrder } from "./order-tracking";

const PAID = {
  label: "29 sept. 2026, 10:05 a. m.",
  dateTime: "2026-09-29T15:05:00.000Z",
};

const IMPORTING: TrackedOrder = {
  number: "MG-2026-480315",
  status: "En importación",
  placedOn: { label: "29 de septiembre de 2026", dateTime: "2026-09-29" },
  steps: [
    {
      id: "pagado",
      label: "Pagado",
      description: "Confirmamos tu pago.",
      state: "done",
      reachedAt: PAID,
    },
    {
      id: "en_importacion",
      label: "En importación",
      description: "Pedimos tus productos al proveedor y los traemos al Perú.",
      state: "current",
      reachedAt: PAID,
    },
    {
      id: "preparando",
      label: "Preparando tu pedido",
      description: "Revisamos y empacamos tu pedido.",
      state: "pending",
    },
    {
      id: "en_camino",
      label: "En camino",
      description: "El courier lleva tu pedido a tu dirección.",
      state: "pending",
    },
    {
      id: "entregado",
      label: "Entregado",
      description: "Tu pedido llega a la dirección de entrega.",
      state: "pending",
    },
  ],
  updatesNote: "Te avisamos de cada cambio por correo a d•••@migeanje.pe.",
  delivery: {
    title: "Llega entre el lunes 26 de octubre y el miércoles 4 de noviembre",
    detail: "Envío a Arequipa · 18–25 días hábiles (15–20 de importación)",
  },
  importNote: {
    title: "Tu pedido está en importación",
    paragraphs: [
      "Pedimos tus productos al proveedor especialmente para ti apenas confirmamos tu pago.",
      "La importación suele tomar 15–20 días hábiles y ya está incluida en la fecha estimada de entrega.",
      "Te escribiremos a tu correo en cada paso: cuando lleguen tus productos, cuando preparemos tu pedido y cuando salga a reparto.",
    ],
  },
  recipient: "Lucía D.",
  shippingAddress: ["Calle…", "Cayma, Arequipa, Arequipa"],
  receipt: "Boleta de venta electrónica",
  summary: {
    lines: [
      {
        key: "UGR-15534",
        name: "Revodok Pro 210 Hub USB-C 10 en 1",
        quantity: 1,
        lineTotal: 19890,
        availability: {
          status: "backorder",
          label: "En importación · llega en 15–20 días",
        },
      },
      {
        key: "ANK-A88E2-090",
        name: "Prime Cable USB-C a USB-C 240W trenzado",
        variantLabel: "0.9 m",
        quantity: 1,
        lineTotal: 8990,
        availability: { status: "in_stock", label: "En stock" },
      },
    ],
    subtotal: 28880,
    shipping: 2000,
    shippingLabel: "Envío a Arequipa",
    total: 30880,
    notes: ["Precios incluyen impuestos."],
  },
};

const DELIVERED_AT = {
  label: "26 sept. 2026, 4:00 p. m.",
  dateTime: "2026-09-26T21:00:00.000Z",
};

const DELIVERED: TrackedOrder = {
  ...IMPORTING,
  number: "MG-2026-913628",
  status: "Entregado",
  placedOn: { label: "25 de septiembre de 2026", dateTime: "2026-09-25" },
  steps: [
    { id: "pagado", label: "Pagado", state: "done", reachedAt: PAID },
    {
      id: "preparando",
      label: "Preparando tu pedido",
      state: "done",
      reachedAt: PAID,
    },
    { id: "en_camino", label: "En camino", state: "done", reachedAt: PAID },
    {
      id: "entregado",
      label: "Entregado",
      description: "Tu pedido llega a la dirección de entrega.",
      state: "current",
      reachedAt: DELIVERED_AT,
    },
  ],
  delivery: {
    title: "Entregado el sábado 26 de septiembre",
    detail: "Envío al Callao",
  },
  importNote: undefined,
  shippingAddress: ["Jr. D…", "Bellavista, Callao, Callao"],
  summary: {
    lines: [
      {
        key: "UGR-60759",
        name: "Cable USB-C a Lightning MFi trenzado",
        variantLabel: "1 m",
        quantity: 2,
        lineTotal: 10980,
        availability: { status: "in_stock", label: "En stock" },
      },
    ],
    subtotal: 10980,
    shipping: 1200,
    shippingLabel: "Envío al Callao",
    total: 12180,
    notes: ["Precios incluyen impuestos."],
  },
};

/** A static stand-in for the module's lookup form (it posts to a server action). */
function LookupForm() {
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <FormField
        label="Número de pedido"
        hint="Está en tu correo de confirmación, por ejemplo MG-2026-004521."
        required
      >
        {(control) => <Input {...control} className="font-mono" />}
      </FormField>
      <FormField label="Correo electrónico" required>
        {(control) => <Input {...control} type="email" />}
      </FormField>
      <div>
        <Button type="submit" size="lg">
          Consultar pedido
        </Button>
      </div>
    </form>
  );
}

const meta = {
  title: "Templates/OrderTracking",
  component: OrderTracking,
  tags: ["autodocs"],
  args: {
    intro:
      "Escribe tu número de pedido y el correo con el que compraste para ver en qué va tu pedido.",
    helpLinks: [
      { href: "/libro-de-reclamaciones", label: "Libro de Reclamaciones" },
      { href: "/envios-y-devoluciones", label: "Envíos y devoluciones" },
      { href: "/garantias", label: "Garantías" },
    ],
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Public order tracking. Without an order: the lookup form (a slot the orders module fills with its server-action form) and an optional aside. With an order: the number in Geist Mono, the current status, the LED timeline, the delivery estimate with the "En importación" explanation, partly hidden delivery data, the order summary and an actions slot.',
      },
    },
  },
} satisfies Meta<typeof OrderTracking>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lookup: Story = {
  name: "Lookup (no order)",
  args: { lookup: <LookupForm /> },
};

export const Importing: Story = {
  name: "En importación",
  args: {
    order: IMPORTING,
    orderActions: (
      <Button variant="secondary" size="lg">
        Consultar otro pedido
      </Button>
    ),
  },
};

export const Delivered: Story = {
  name: "Entregado",
  args: {
    order: DELIVERED,
    orderActions: (
      <Button variant="secondary" size="lg">
        Consultar otro pedido
      </Button>
    ),
  },
};
