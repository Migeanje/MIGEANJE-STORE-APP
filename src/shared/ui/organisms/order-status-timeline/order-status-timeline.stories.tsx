import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  type OrderStatusStep,
  OrderStatusTimeline,
} from "./order-status-timeline";

const PAID = {
  label: "29 sept. 2026, 10:05 a. m.",
  dateTime: "2026-09-29T15:05:00.000Z",
};
const PREPARED = {
  label: "1 oct. 2026, 9:40 a. m.",
  dateTime: "2026-10-01T14:40:00.000Z",
};
const SHIPPED = {
  label: "2 oct. 2026, 8:15 a. m.",
  dateTime: "2026-10-02T13:15:00.000Z",
};
const DELIVERED_AT = {
  label: "2 oct. 2026, 4:30 p. m.",
  dateTime: "2026-10-02T21:30:00.000Z",
};

const DESCRIPTIONS = {
  pagado: "Confirmamos tu pago.",
  en_importacion: "Pedimos tus productos al proveedor y los traemos al Perú.",
  preparando: "Revisamos y empacamos tu pedido.",
  en_camino: "El courier lleva tu pedido a tu dirección.",
  entregado: "Tu pedido llegó a la dirección de entrega.",
};

const IMPORTING: OrderStatusStep[] = [
  {
    id: "pagado",
    label: "Pagado",
    description: DESCRIPTIONS.pagado,
    state: "done",
    reachedAt: PAID,
  },
  {
    id: "en_importacion",
    label: "En importación",
    description: DESCRIPTIONS.en_importacion,
    state: "current",
    reachedAt: PAID,
  },
  {
    id: "preparando",
    label: "Preparando tu pedido",
    description: DESCRIPTIONS.preparando,
    state: "pending",
  },
  {
    id: "en_camino",
    label: "En camino",
    description: DESCRIPTIONS.en_camino,
    state: "pending",
  },
  {
    id: "entregado",
    label: "Entregado",
    description: DESCRIPTIONS.entregado,
    state: "pending",
  },
];

const meta = {
  title: "Organisms/OrderStatusTimeline",
  component: OrderStatusTimeline,
  tags: ["autodocs"],
  args: { steps: IMPORTING, "aria-label": "Estado del pedido" },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The statuses of an order as a vertical row of LEDs: done steps lit amber, the current one glowing with `aria-current="step"` and the text "Estado actual", pending ones as `led-off` rings. Every step says its state in words and when it was reached.',
      },
    },
  },
} satisfies Meta<typeof OrderStatusTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Importing: Story = { name: "En importación (backorder)" };

export const OnTheWay: Story = {
  name: "En camino (in stock)",
  args: {
    steps: [
      {
        id: "pagado",
        label: "Pagado",
        description: DESCRIPTIONS.pagado,
        state: "done",
        reachedAt: PAID,
      },
      {
        id: "preparando",
        label: "Preparando tu pedido",
        description: DESCRIPTIONS.preparando,
        state: "done",
        reachedAt: PREPARED,
      },
      {
        id: "en_camino",
        label: "En camino",
        description: DESCRIPTIONS.en_camino,
        state: "current",
        reachedAt: SHIPPED,
      },
      {
        id: "entregado",
        label: "Entregado",
        description: DESCRIPTIONS.entregado,
        state: "pending",
      },
    ],
  },
};

export const Delivered: Story = {
  name: "Entregado",
  args: {
    steps: [
      { id: "pagado", label: "Pagado", state: "done", reachedAt: PAID },
      {
        id: "preparando",
        label: "Preparando tu pedido",
        state: "done",
        reachedAt: PREPARED,
      },
      {
        id: "en_camino",
        label: "En camino",
        state: "done",
        reachedAt: SHIPPED,
      },
      {
        id: "entregado",
        label: "Entregado",
        description: DESCRIPTIONS.entregado,
        state: "current",
        reachedAt: DELIVERED_AT,
      },
    ],
  },
};
