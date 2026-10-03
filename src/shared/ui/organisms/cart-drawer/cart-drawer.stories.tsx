import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, within } from "storybook/test";
import { Button } from "@/shared/ui/atoms/button";
import {
  BACKORDER_LINE,
  IN_STOCK_LINE,
} from "../cart-line-list/__fixtures__/cart-lines";
import { CartDrawer } from "./cart-drawer";

const SHIPPING = "El envío se calcula en el checkout.";
const MIXED =
  "Tu pedido incluye productos en importación: lo enviamos completo cuando todo esté disponible, en 15–20 días.";

const meta = {
  title: "Organisms/CartDrawer",
  component: CartDrawer,
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: fn(),
    lines: [IN_STOCK_LINE],
    itemCountLabel: "2 productos",
    subtotal: 37980,
    notes: [SHIPPING],
    onQuantityChange: fn(),
    onRemove: fn(),
  },
  parameters: {
    // The drawer is a modal in a portal: each story gets its own iframe.
    docs: {
      story: { inline: false, iframeHeight: 720 },
      description: {
        component:
          'The cart drawer: a right-side Sheet named "Tu carrito" (focus trap, Escape, focus return, `data-lenis-prevent`). Lines with a controlled quantity stepper and "Quitar", then the subtotal, notes ("El envío se calcula en el checkout" and, with a backorder, how the order ships), "Ir a pagar" and "Seguir comprando". A polite status region announces "Agregaste … al carrito" (focused when the drawer opens after an add) and errors (the change was rolled back). Following a link inside closes it. The cart module feeds it (optimistic state, server actions).',
      },
    },
  },
  render: function Render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Abrir carrito
        </Button>
        <CartDrawer
          {...args}
          open={open}
          onOpenChange={(next) => {
            args.onOpenChange(next);
            setOpen(next);
          }}
        />
      </>
    );
  },
} satisfies Meta<typeof CartDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    lines: [],
    itemCountLabel: "0 productos",
    subtotal: 0,
    notes: [],
    emptyState: (
      <nav aria-label="Explora por categoría" className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <a href="/categorias/cargadores">Cargadores</a>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <a href="/categorias/cables">Cables</a>
        </Button>
      </nav>
    ),
  },
};

export const OneLine: Story = {
  name: "One line, just added",
  args: {
    status: { message: "Agregaste Prime Charger 100W, 3 puertos al carrito" },
    focusStatusOnOpen: true,
  },
  play: async () => {
    // The drawer renders in a portal on document.body.
    const status = within(document.body).getByRole("status");
    await expect(status).toHaveFocus();
  },
};

export const MixedWithBackorder: Story = {
  name: "Mixed cart with a backorder",
  args: {
    lines: [IN_STOCK_LINE, BACKORDER_LINE],
    itemCountLabel: "3 productos",
    subtotal: 62870,
    notes: [SHIPPING, MIXED],
  },
};

export const ErrorState: Story = {
  name: "Error (change rolled back)",
  args: {
    lines: [IN_STOCK_LINE, BACKORDER_LINE],
    itemCountLabel: "3 productos",
    subtotal: 62870,
    notes: [SHIPPING, MIXED],
    status: {
      message:
        "Nano Charger 45W Smart Display (Blanco) se agotó: no pudimos cambiar la cantidad.",
      tone: "error",
    },
  },
};
