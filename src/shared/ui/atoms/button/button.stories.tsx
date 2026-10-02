import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Bell, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";

const VARIANTS = ["primary", "secondary", "ghost", "destructive"] as const;
const SIZES = ["sm", "md", "lg"] as const;

const meta = {
  title: "Atoms/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Agregar al carrito",
  },
  argTypes: {
    variant: { control: "inline-radio", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    asChild: { control: false },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Pill button. `primary` turns on the amber glow (encendido) at hover and keyboard focus; under reduced motion it turns on instantly. Sizes: `sm` 36px, `md` 44px (default, mobile target), `lg` 56px. Defaults to `type="button"`. `loading` disables the button, sets `aria-busy` and swaps the label for a spinner without changing the width. Use `asChild` to style a Next `Link`.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Avísame cuando llegue",
    leadingIcon: <Bell />,
  },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ver detalles" },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Quitar del carrito",
    leadingIcon: <Trash2 />,
  },
};

export const WithIcons: Story = {
  args: {
    leadingIcon: <ShoppingCart />,
    trailingIcon: <ArrowRight />,
  },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const AsLink: Story = {
  name: "As link (asChild)",
  args: {
    asChild: true,
    variant: "secondary",
    trailingIcon: <ArrowRight />,
    children: <Link href="/productos">Ver todos los productos</Link>,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {SIZES.map((size) => (
        <Button key={size} size={size} leadingIcon={<ShoppingCart />}>
          Agregar al carrito
        </Button>
      ))}
    </div>
  ),
};

export const AllVariantsAndStates: Story = {
  name: "All variants and states",
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-col gap-2">
          <p className="font-mono text-caption text-muted-foreground">
            {variant}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant={variant}>Comprar ahora</Button>
            <Button variant={variant} disabled>
              Comprar ahora
            </Button>
            <Button variant={variant} loading>
              Comprar ahora
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
};
