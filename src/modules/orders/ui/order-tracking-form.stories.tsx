import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OrderTrackingForm, type TrackAction } from "./order-tracking-form";
import { trackingInitialState } from "./tracking-form";

// Stands in for `trackOrderAction`: always answers the neutral "not found".
const notFound: TrackAction = async (state, formData) => ({
  values: {
    number: String(formData.get("number") ?? ""),
    email: String(formData.get("email") ?? ""),
  },
  errors: {},
  formError: {
    title: "Revisa estos datos",
    message:
      "No encontramos un pedido con esos datos. Revisa el número y el correo con el que compraste.",
  },
  attempt: state.attempt + 1,
});

const meta = {
  title: "Orders/OrderTrackingForm",
  component: OrderTrackingForm,
  tags: ["autodocs"],
  args: { action: notFound, initialState: trackingInitialState(undefined) },
  decorators: [
    (Story) => (
      <div className="max-w-xl rounded-lg border bg-card p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "The public lookup of /pedidos/seguimiento: order number (Geist Mono; lowercase and spaces are fine) and the buyer's email, checked on the client with the server's Zod schema, then posted to `trackOrderAction` (works without JavaScript). Here the action always answers the neutral \"not found\".",
      },
    },
  },
} satisfies Meta<typeof OrderTrackingForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const PrefilledNumber: Story = {
  name: "Number from the link (?numero=)",
  args: { initialState: trackingInitialState("MG-2026-480315") },
};

export const NotFound: Story = {
  name: "Server answer: not found",
  args: {
    initialState: {
      values: { number: "MG-2026-480315", email: "otra@correo.pe" },
      errors: {},
      formError: {
        title: "Revisa estos datos",
        message:
          "No encontramos un pedido con esos datos. Revisa el número y el correo con el que compraste.",
      },
      attempt: 1,
    },
  },
};

export const TooManyAttempts: Story = {
  name: "Server answer: too many attempts",
  args: {
    initialState: {
      values: { number: "MG-2026-480315", email: "otra@correo.pe" },
      errors: {},
      formError: {
        title: "Demasiados intentos",
        message:
          "Por tu seguridad pausamos las consultas desde tu conexión. Espera unos minutos y vuelve a intentarlo.",
      },
      attempt: 11,
    },
  },
};
