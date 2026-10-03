import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import { REGISTER_COPY } from "./account-copy";
import { type RegisterAction, RegisterForm } from "./register-form";

// Stands in for `registerAction`: the email always has an account already.
const emailTaken: RegisterAction = async (state, formData) => {
  const { password: _password, ...values } = Object.fromEntries(
    [...formData].map(([name, value]) => [name, String(value)]),
  );
  return {
    values,
    errors: {},
    formError: REGISTER_COPY.emailTaken,
    attempt: state.attempt + 1,
  };
};

const meta = {
  title: "Account/RegisterForm",
  component: RegisterForm,
  tags: ["autodocs"],
  args: {
    action: emailTaken,
    initialState: initialFormState(),
    termsHref: "/terminos",
    privacyHref: "/privacidad",
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg rounded-lg border bg-card p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Registration at /cuenta/registro: names, email, optional mobile, a new password (its rules are the hint, before typing) and the consent to the terms and the privacy policy. Client checks with the server's Zod schema, then `registerAction` (works without JavaScript); the password never comes back. Here the action always answers that the email has an account.",
      },
    },
  },
} satisfies Meta<typeof RegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WeakPassword: Story = {
  name: "Server answer: field errors",
  args: {
    initialState: {
      values: {
        firstName: "Luis",
        lastName: "Rojas",
        email: "luis@correo.pe",
        phone: "",
      },
      errors: {
        password:
          "Tu contraseña necesita: entre 8 y 128 caracteres y al menos un número.",
        acceptTerms:
          "Acepta los términos y la política de privacidad para crear tu cuenta.",
      },
      formError: null,
      attempt: 1,
    },
  },
};
