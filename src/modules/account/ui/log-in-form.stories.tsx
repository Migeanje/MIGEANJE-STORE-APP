import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import { LOG_IN_COPY } from "./account-copy";
import { type LogInAction, LogInForm } from "./log-in-form";

// Stands in for `logInAction`: always the neutral "wrong email or password".
const invalid: LogInAction = async (state, formData) => ({
  values: { email: String(formData.get("email") ?? "") },
  errors: {},
  formError: LOG_IN_COPY.invalid,
  attempt: state.attempt + 1,
});

const meta = {
  title: "Account/LogInForm",
  component: LogInForm,
  tags: ["autodocs"],
  args: { action: invalid, initialState: initialFormState() },
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-lg border bg-card p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Sign-in at /cuenta/ingresar: email and password with password-manager autocomplete hints, checked on the client with the server's Zod schema, then posted to `logInAction` (works without JavaScript). Unknown emails and wrong passwords get the same answer. Here the action always answers it.",
      },
    },
  },
} satisfies Meta<typeof LogInForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WrongPassword: Story = {
  name: "Server answer: wrong email or password",
  args: {
    initialState: {
      values: { email: "demo@migeanje.pe" },
      errors: {},
      formError: LOG_IN_COPY.invalid,
      attempt: 1,
    },
  },
};

export const TooManyAttempts: Story = {
  name: "Server answer: too many attempts",
  args: {
    initialState: {
      values: { email: "demo@migeanje.pe" },
      errors: {},
      formError: LOG_IN_COPY.tooManyAttempts,
      attempt: 11,
    },
  },
};
