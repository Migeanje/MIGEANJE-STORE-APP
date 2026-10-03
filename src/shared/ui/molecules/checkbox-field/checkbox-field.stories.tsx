import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckboxField } from "./checkbox-field";

const meta = {
  title: "Molecules/CheckboxField",
  component: CheckboxField,
  tags: ["autodocs"],
  args: {
    id: "principal",
    name: "principal",
    value: "si",
    label: "Usar como dirección principal",
  },
  parameters: {
    docs: {
      description: {
        component:
          "A native checkbox with its label, an optional hint and an error (wired with `aria-describedby` and `aria-invalid`). It posts with the form without JavaScript.",
      },
    },
  },
} satisfies Meta<typeof CheckboxField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const WithHint: Story = {
  name: "With hint",
  args: { hint: "La usaremos primero cuando compres." },
};

export const WithError: Story = {
  name: "With error",
  args: {
    id: "terminos",
    label: "Acepto los términos y la política de privacidad",
    required: true,
    error: "Acepta los términos para crear tu cuenta.",
  },
};
