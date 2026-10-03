import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "../label";
import { Select } from "./select";

const meta = {
  title: "Atoms/Select",
  component: Select,
  tags: ["autodocs"],
  args: { id: "tipo-documento", defaultValue: "dni" },
  parameters: {
    docs: {
      description: {
        component:
          "Native `<select>` with the Input styles (44px, `rounded-md`, `input` border, amber focus ring) and a decorative chevron. Native on purpose: it submits without JavaScript and phones show their own picker. `aria-invalid` turns the border `destructive`. Wrap it in FormField to wire the label, hint and error.",
      },
    },
  },
  render: (args) => (
    <div className="flex max-w-xs flex-col gap-2">
      <Label htmlFor={args.id}>Tipo de documento</Label>
      <Select {...args}>
        <option value="dni">DNI</option>
        <option value="ce">Carné de extranjería</option>
      </Select>
    </div>
  ),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { id: "tipo-invalido", "aria-invalid": true },
};

export const Disabled: Story = {
  args: { id: "tipo-deshabilitado", disabled: true },
};
