import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { QuantityStepper } from "./quantity-stepper";

const meta = {
  title: "Molecules/QuantityStepper",
  component: QuantityStepper,
  tags: ["autodocs"],
  args: {
    label: "Cantidad",
    defaultValue: 1,
    min: 1,
    max: 10,
    onValueChange: fn(),
  },
  argTypes: {
    disabled: { control: "boolean" },
    value: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Quantity field with − and + buttons (44px, names from visually hidden text: "Disminuir cantidad", "Aumentar cantidad"). The field is a `spinbutton` named by `label`: ArrowUp/ArrowDown step the value, typed digits commit on blur or Enter clamped to [min, max], and anything that is not a digit is rejected. Each button is disabled at its bound and focus then moves to the field. Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).',
      },
    },
  },
} satisfies Meta<typeof QuantityStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AtMaximum: Story = {
  name: "At the maximum (stock)",
  args: { defaultValue: 3, max: 3, label: "Cantidad de cables" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 2 },
};

function CartLineDemo() {
  const [quantity, setQuantity] = useState(2);
  return (
    <div className="flex max-w-md items-center justify-between gap-4 rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-1">
        <p className="text-body font-medium">Cargador GaN 65 W, 3 puertos</p>
        <p className="font-mono text-body-sm text-muted-foreground">
          Quedan 5 unidades
        </p>
      </div>
      <QuantityStepper
        label="Cantidad de Cargador GaN 65 W, 3 puertos"
        value={quantity}
        onValueChange={setQuantity}
        max={5}
      />
    </div>
  );
}

export const InCartLine: Story = {
  name: "Controlled, in a cart line",
  render: () => <CartLineDemo />,
};
