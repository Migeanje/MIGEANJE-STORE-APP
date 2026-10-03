import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, ShoppingCart } from "lucide-react";
import { Button } from "@/shared/ui/atoms/button";
import { QuantityStepper } from "@/shared/ui/molecules/quantity-stepper";
import { PurchasePanel } from "./purchase-panel";

const meta = {
  title: "Organisms/PurchasePanel",
  component: PurchasePanel,
  tags: ["autodocs"],
  args: {
    price: { amount: 18990 },
    availability: { status: "in_stock", label: "En stock" },
    sku: "ANK-A2688",
  },
  argTypes: {
    price: { control: false },
    availability: { control: false },
    children: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "The buy box of the product page (sticky from `lg` in the page template): price with the previous price struck through, the availability LED, an optional explainer (how a backorder works) and the actions passed as children.",
      },
    },
  },
} satisfies Meta<typeof PurchasePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InStock: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-3">
        <QuantityStepper label="Cantidad" max={5} />
        <Button size="lg" leadingIcon={<ShoppingCart />}>
          Agregar al carrito
        </Button>
      </div>
    ),
  },
};

export const Backorder: Story = {
  args: {
    price: { amount: 24890, compareAt: 27990 },
    availability: {
      status: "backorder",
      label: "En importación · llega en 15–20 días",
    },
    note: "En importación: lo pedimos para ti y llega en 15–20 días; pagas hoy y te avisamos en cada paso.",
    sku: "ANK-A121D-BLK",
    children: (
      <div className="flex flex-col gap-3">
        <QuantityStepper label="Cantidad" max={2} />
        <Button size="lg" leadingIcon={<ShoppingCart />}>
          Agregar al carrito
        </Button>
      </div>
    ),
  },
};

export const Unavailable: Story = {
  args: {
    price: { amount: 649890 },
    availability: { status: "unavailable", label: "Agotado" },
    sku: "APL-MBA13-M5-G8-16-512-SKY",
    children: (
      <Button size="lg" leadingIcon={<Bell />}>
        Avísame cuando llegue
      </Button>
    ),
  },
};
