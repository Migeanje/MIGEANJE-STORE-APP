import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CartButton } from "./cart-button";

const meta = {
  title: "Molecules/CartButton",
  component: CartButton,
  tags: ["autodocs"],
  args: { count: 0, href: "/carrito" },
  argTypes: {
    count: { control: { type: "number", min: 0, step: 1 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The header cart control: a bag icon named "Carrito, N productos" with an amber count badge above 0 (capped at "99+"). The server HTML is a link to `/carrito` (works before and without JavaScript); once hydrated and given `onOpen`, it becomes a button with `aria-haspopup="dialog"` and `aria-expanded` that opens the cart drawer.',
      },
    },
  },
} satisfies Meta<typeof CartButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const UnknownCount: Story = {
  name: "Unknown count (cart still loading)",
  args: { count: undefined },
};

export const WithItems: Story = {
  name: "With items (link)",
  args: { count: 3 },
};

export const OpensDrawer: Story = {
  name: "Opens the drawer (button)",
  args: { count: 3, onOpen: fn() },
};

export const ManyItems: Story = {
  name: "More than 99 items",
  args: { count: 120, onOpen: fn() },
};
