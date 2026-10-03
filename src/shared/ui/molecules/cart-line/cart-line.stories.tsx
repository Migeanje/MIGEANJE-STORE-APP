import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/atoms/button";
import placeholder from "../product-card/__fixtures__/placeholder.svg";
import { CartLine } from "./cart-line";

const meta = {
  title: "Molecules/CartLine",
  component: CartLine,
  tags: ["autodocs"],
  args: {
    href: "/productos/anker-prime-charger-100w-3-puertos",
    name: "Prime Charger 100W, 3 puertos",
    brand: "Anker",
    image: { src: placeholder, width: 480, height: 480 },
    availability: { status: "in_stock", label: "En stock" },
    unitPrice: 18990,
    lineTotal: 18990,
    quantity: 1,
  },
  parameters: {
    docs: {
      description: {
        component:
          "One product in the cart: decorative thumbnail, brand, name linking to the product page, variant, availability LED (the label carries the lead time), the line total (with the unit price when there is more than one unit) and the controls passed as children. Used by the cart drawer and the cart page.",
      },
    },
  },
  render: (args) => (
    <div className="max-w-md">
      <CartLine {...args} />
    </div>
  ),
} satisfies Meta<typeof CartLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InStock: Story = {};

export const Backorder: Story = {
  name: "Backorder, two units",
  args: {
    href: "/productos/anker-nano-charger-45w-smart-display?variante=ank-a121d-wht",
    name: "Nano Charger 45W Smart Display",
    variantLabel: "Blanco",
    availability: {
      status: "backorder",
      label: "En importación · llega en 15–20 días",
    },
    unitPrice: 24890,
    lineTotal: 49780,
    quantity: 2,
  },
};

export const WithControls: Story = {
  name: "With controls",
  args: {
    children: (
      <Button variant="ghost" size="sm" leadingIcon={<Trash2 />}>
        Quitar
      </Button>
    ),
  },
};
