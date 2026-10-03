import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardPaymentFields } from "./card-payment-fields";

const meta = {
  title: "Organisms/CardPaymentFields",
  component: CardPaymentFields,
  tags: ["autodocs"],
  args: { idPrefix: "historia-pago", termsHref: "/terminos" },
  parameters: {
    docs: {
      description: {
        component:
          'The card part of the payment step: the "Modo demostración" banner with the test cards (simulated payment until Culqi), card number, expiry, CVV and holder with `cc-*` autocomplete and numeric keyboards, and the terms checkbox linking to the terms. The surrounding form validates (Luhn, expiry, CVV) and never stores card data.',
      },
    },
  },
  render: (args) => (
    <form className="max-w-xl">
      <CardPaymentFields {...args} />
    </form>
  ),
} satisfies Meta<typeof CardPaymentFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DemoMode: Story = { name: "Demo mode" };

export const WithErrors: Story = {
  name: "With errors",
  args: {
    errors: {
      number: "Revisa el número de tu tarjeta.",
      expiry: "Tu tarjeta está vencida.",
      cvv: "El CVV tiene 3 o 4 dígitos.",
      holder: "Escribe el nombre como aparece en la tarjeta.",
      terms: "Acepta los términos y condiciones para continuar.",
    },
  },
};

export const LivePayments: Story = {
  name: "Without the demo banner",
  args: { demo: false },
};
