import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckoutSteps, type CheckoutStepsProps } from "./checkout-steps";

function steps(current: 0 | 1 | 2): CheckoutStepsProps["steps"] {
  const all = [
    { id: "contacto", label: "Contacto y envío", href: "/checkout/contacto" },
    { id: "comprobante", label: "Comprobante", href: "/checkout/comprobante" },
    { id: "pago", label: "Pago", href: "/checkout/pago" },
  ];
  return all.map((step, index) => ({
    ...step,
    state:
      index < current ? "complete" : index === current ? "current" : "upcoming",
  }));
}

const meta = {
  title: "Molecules/CheckoutSteps",
  component: CheckoutSteps,
  tags: ["autodocs"],
  args: { steps: steps(0) },
  parameters: {
    docs: {
      description: {
        component:
          'Checkout progress as a labelled navigation with an ordered list. Completed steps link back (check mark plus a visually hidden "(completado)"), the current one carries `aria-current="step"` and the LED glow, upcoming ones are muted text. Exactly one step must be current (RangeError otherwise). Labels sit under the numbers on phones.',
      },
    },
  },
  render: (args) => (
    <div className="max-w-2xl">
      <CheckoutSteps {...args} />
    </div>
  ),
} satisfies Meta<typeof CheckoutSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Contact: Story = { name: "Step 1: contact" };

export const Receipt: Story = {
  name: "Step 2: receipt",
  args: { steps: steps(1) },
};

export const Payment: Story = {
  name: "Step 3: payment",
  args: { steps: steps(2) },
};
