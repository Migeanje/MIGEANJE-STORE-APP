import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ErrorSummary } from "./error-summary";

const meta = {
  title: "Molecules/ErrorSummary",
  component: ErrorSummary,
  tags: ["autodocs"],
  args: {
    items: [
      { fieldId: "correo", message: "Escribe tu correo electrónico." },
      {
        fieldId: "celular",
        message: "Escribe un celular de 9 dígitos que empiece con 9.",
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          "The errors of a form after a failed submit, at its top: a focusable region (the form moves focus here) titled by its heading, an optional message about the whole form and one link per field error. Following a link focuses the field. Renders nothing without errors.",
      },
    },
  },
  render: (args) => (
    <div className="flex max-w-xl flex-col gap-6">
      <ErrorSummary {...args} />
      <div className="flex flex-col gap-2 text-body-sm text-muted-foreground">
        <label htmlFor="correo">Correo electrónico</label>
        <input
          id="correo"
          className="h-11 rounded-md border border-input bg-card px-4"
        />
        <label htmlFor="celular">Celular</label>
        <input
          id="celular"
          className="h-11 rounded-md border border-input bg-card px-4"
        />
      </div>
    </div>
  ),
} satisfies Meta<typeof ErrorSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FieldErrors: Story = {};

export const DeclinedPayment: Story = {
  name: "Form message (declined payment)",
  args: {
    title: "No pudimos procesar el pago",
    message:
      "Tu banco rechazó la tarjeta. Prueba con otra tarjeta o comunícate con tu banco. No se hizo ningún cargo.",
    items: [],
  },
};
