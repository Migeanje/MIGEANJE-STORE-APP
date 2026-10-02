import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@/shared/ui/atoms/input";
import { FormField } from "./form-field";

const meta = {
  title: "Molecules/FormField",
  component: FormField,
  tags: ["autodocs"],
  args: {
    label: "Nombre completo",
  },
  argTypes: {
    required: { control: "boolean" },
    hint: { control: "text" },
    error: { control: "text" },
    label: { control: "text" },
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
          'Label + control + optional hint + FieldError. Ids come from `useId` (or `controlId`); the control gets `aria-describedby` (hint, then error, only when present), `aria-invalid` while there is an error, and `required` plus `aria-required` when required. The control is a render prop that receives those props (`{(control) => <Input {...control} type="email" />}`); without it, FormField renders an `Input`.',
      },
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = {
  name: "With hint",
  args: {
    label: "Celular",
    hint: "9 dígitos, sin espacios. Te escribiremos por WhatsApp si hay novedades con tu pedido.",
    children: (control) => (
      <Input
        {...control}
        type="tel"
        autoComplete="tel"
        placeholder="987654321"
      />
    ),
  },
};

export const WithError: Story = {
  name: "With error",
  args: {
    label: "Correo electrónico",
    required: true,
    hint: "Te enviaremos la confirmación del pedido a este correo.",
    error: "Ingresa un correo válido, por ejemplo nombre@correo.com.",
    children: (control) => (
      <Input
        {...control}
        type="email"
        autoComplete="email"
        defaultValue="ana@correo"
      />
    ),
  },
};

export const Required: Story = {
  args: {
    label: "DNI",
    required: true,
    children: (control) => (
      <Input
        {...control}
        inputMode="numeric"
        autoComplete="off"
        placeholder="12345678"
      />
    ),
  },
};

export const CheckoutForm: Story = {
  name: "Checkout form",
  render: () => (
    <form className="grid gap-5" noValidate>
      <FormField label="Nombre completo" required>
        {(control) => <Input {...control} autoComplete="name" />}
      </FormField>
      <FormField
        label="Correo electrónico"
        required
        error="Ingresa un correo válido, por ejemplo nombre@correo.com."
      >
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            defaultValue="ana@correo"
          />
        )}
      </FormField>
      <FormField label="Celular" hint="9 dígitos, sin espacios.">
        {(control) => <Input {...control} type="tel" autoComplete="tel" />}
      </FormField>
      <FormField label="Empresa (opcional)" />
    </form>
  ),
};
