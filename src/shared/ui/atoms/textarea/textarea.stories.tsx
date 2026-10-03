import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FieldError } from "../field-error";
import { Label } from "../label";
import { Textarea } from "./textarea";

const meta = {
  title: "Atoms/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    "aria-label": "Detalle",
    placeholder: "Cuéntanos qué pasó.",
  },
  argTypes: {
    disabled: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Native multi-line text field with the Input\'s look: `rounded-md` on `card`, the `input` border and the amber focus ring; at least 128px tall and resizable vertically. `aria-invalid="true"` turns the border `destructive`. Wrap it in FormField to wire the label, hint and error.',
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: {
    defaultValue:
      "El cargador dejó de funcionar a la semana de recibirlo. Probé con dos cables distintos y no carga.",
  },
};

export const Invalid: Story = {
  args: { "aria-invalid": "true" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Cambio del producto." },
};

export const WithLabelAndFieldError: Story = {
  name: "With Label and FieldError",
  render: () => (
    <div className="flex max-w-xl flex-col gap-2">
      <Label htmlFor="detail" required>
        Detalle
      </Label>
      <Textarea
        id="detail"
        required
        aria-invalid="true"
        aria-describedby="detail-error"
      />
      <FieldError id="detail-error">Cuéntanos qué pasó.</FieldError>
    </div>
  ),
};
