import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../button";
import {
  AvailabilityIndicator,
  type AvailabilityStatus,
} from "./availability-indicator";

const STATES: { status: AvailabilityStatus; label: string }[] = [
  { status: "in_stock", label: "En stock" },
  { status: "backorder", label: "En importación · llega en 15–20 días" },
  { status: "unavailable", label: "Agotado" },
];

// Class names are written in full so Tailwind detects them.
const SURFACES = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "surface-raised", className: "bg-surface-raised" },
] as const;

const meta = {
  title: "Atoms/AvailabilityIndicator",
  component: AvailabilityIndicator,
  tags: ["autodocs"],
  args: {
    status: "in_stock",
    children: "En stock",
  },
  argTypes: {
    status: {
      control: "inline-radio",
      options: STATES.map((state) => state.status),
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Availability LED, like a charger pilot light: lit (`in_stock`), half-lit ring (`backorder`), gray ring (`unavailable`). The dot is decorative; the mono label always carries the meaning, so color is never the only signal. Callers pass the copy.",
      },
    },
  },
} satisfies Meta<typeof AvailabilityIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InStock: Story = {
  name: "In stock",
};

export const Backorder: Story = {
  args: {
    status: "backorder",
    children: "En importación · llega en 15–20 días",
  },
};

export const Unavailable: Story = {
  args: { status: "unavailable", children: "Agotado" },
};

export const OnSurfaces: Story = {
  name: "On every surface",
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      {SURFACES.map((surface) => (
        <div
          key={surface.name}
          className={`flex flex-col gap-4 rounded-lg border p-5 ${surface.className}`}
        >
          <p className="font-mono text-caption text-muted-foreground">
            {surface.name}
          </p>
          {STATES.map((state) => (
            <AvailabilityIndicator key={state.status} status={state.status}>
              {state.label}
            </AvailabilityIndicator>
          ))}
        </div>
      ))}
    </div>
  ),
};

function ProductCardPreview({
  name,
  price,
  status,
  label,
  action,
}: {
  name: string;
  price: string;
  status: AvailabilityStatus;
  label: string;
  action: ReactNode;
}) {
  return (
    <div className="flex w-72 flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-1">
        <p className="text-body font-medium">{name}</p>
        <p className="font-mono text-body-sm text-muted-foreground">{price}</p>
      </div>
      <AvailabilityIndicator status={status}>{label}</AvailabilityIndicator>
      {action}
    </div>
  );
}

export const WithButtonOnProductCard: Story = {
  name: "With Button on a product card",
  render: () => (
    <div className="flex flex-wrap gap-6">
      <ProductCardPreview
        name="Cargador GaN 65 W, 3 puertos"
        price="S/ 189.00"
        status="in_stock"
        label="En stock"
        action={
          <Button className="w-full" leadingIcon={<ShoppingCart />}>
            Agregar al carrito
          </Button>
        }
      />
      <ProductCardPreview
        name="Power bank 20 000 mAh"
        price="S/ 249.00"
        status="backorder"
        label="En importación · llega en 15–20 días"
        action={<Button className="w-full">Comprar ahora</Button>}
      />
      <ProductCardPreview
        name="Cable USB-C a USB-C, 2 m"
        price="S/ 59.00"
        status="unavailable"
        label="Agotado"
        action={
          <Button className="w-full" variant="secondary" leadingIcon={<Bell />}>
            Avísame cuando llegue
          </Button>
        }
      />
    </div>
  ),
};
