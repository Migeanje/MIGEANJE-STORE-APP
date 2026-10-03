import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OrderSummary, type OrderSummaryProps } from "./order-summary";

const LINES: OrderSummaryProps["lines"] = [
  {
    key: "ANK-A2688",
    name: "Prime Charger 100W, 3 puertos",
    quantity: 2,
    lineTotal: 37980,
    availability: { status: "in_stock", label: "En stock" },
  },
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
];

const meta = {
  title: "Organisms/OrderSummary",
  component: OrderSummary,
  tags: ["autodocs"],
  args: {
    lines: LINES,
    subtotal: 62870,
    shipping: 2000,
    shippingLabel: "Envío a Arequipa",
    total: 64870,
    notes: [
      "Precios incluyen impuestos.",
      "Entrega en 18–25 días hábiles: 15–20 de importación y 3–5 de envío.",
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          'What the customer is buying: each line with quantity, availability LED (with the lead time) and total, then subtotal, shipping ("Se calcula con tu dirección" until the address is known) and total in soles from céntimos, and notes. `collapsible` hides the detail behind a native `<details>` on phones, with the total in its summary.',
      },
    },
  },
  render: (args) => (
    <div className="max-w-sm rounded-lg border bg-card p-5">
      <OrderSummary {...args} />
    </div>
  ),
} satisfies Meta<typeof OrderSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithShipping: Story = { name: "With shipping (mixed cart)" };

export const BeforeAddress: Story = {
  name: "Before the address",
  args: {
    shipping: null,
    shippingLabel: undefined,
    total: null,
    notes: ["Precios incluyen impuestos."],
  },
};

export const Collapsible: Story = {
  name: "Collapsible (narrow viewport to see the disclosure)",
  args: { collapsible: true },
};
