import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { Button } from "@/shared/ui/atoms/button";
import { CartSummary } from "./cart-summary";

const meta = {
  title: "Molecules/CartSummary",
  component: CartSummary,
  tags: ["autodocs"],
  args: {
    subtotal: 37980,
    itemCountLabel: "2 productos",
    notes: ["El envío se calcula en el checkout."],
    checkoutHref: "/checkout",
    secondaryAction: (
      <Button asChild variant="secondary" size="lg">
        <Link href="/">Seguir comprando</Link>
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        component:
          'The cart footer: subtotal in soles (from céntimos) with the item count, notes (shipping, and how a backorder ships), the primary "Ir a pagar" CTA and a secondary action ("Seguir comprando").',
      },
    },
  },
  render: (args) => (
    <div className="max-w-sm">
      <CartSummary {...args} />
    </div>
  ),
} satisfies Meta<typeof CartSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InStock: Story = {};

export const MixedCart: Story = {
  name: "Mixed cart (backorder note)",
  args: {
    subtotal: 62870,
    itemCountLabel: "3 productos",
    notes: [
      "El envío se calcula en el checkout.",
      "Tu pedido incluye productos en importación: lo enviamos completo cuando todo esté disponible, en 15–20 días.",
    ],
  },
};

export const WithTitle: Story = {
  name: "With a title (cart page)",
  args: { title: "Resumen" },
};
