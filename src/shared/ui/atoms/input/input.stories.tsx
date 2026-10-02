import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FieldError } from "../field-error";
import { Label } from "../label";
import { Input } from "./input";

// Class names are written in full so Tailwind detects them.
const SURFACES = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "surface-raised", className: "bg-surface-raised" },
] as const;

const meta = {
  title: "Atoms/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    "aria-label": "Nombre completo",
    placeholder: "Ana Torres",
  },
  argTypes: {
    type: {
      control: "inline-radio",
      options: ["text", "email", "tel", "search"],
    },
    disabled: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Native input, 44px tall, `rounded-md` on `card` with the `input` border (>= 3:1) and the amber focus ring. `aria-invalid="true"` turns the border `destructive`; the FieldError text carries the meaning. Forwards every native prop and the ref. The FormField molecule wires Label, Input and FieldError together.',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Email: Story = {
  args: {
    type: "email",
    "aria-label": "Correo electrónico",
    placeholder: "nombre@correo.com",
    autoComplete: "email",
  },
};

export const Phone: Story = {
  args: {
    type: "tel",
    "aria-label": "Celular",
    placeholder: "987 654 321",
    autoComplete: "tel",
  },
};

export const Search: Story = {
  args: {
    type: "search",
    "aria-label": "Buscar productos",
    placeholder: "Busca cargadores, cables, power banks…",
  },
};

export const Invalid: Story = {
  args: { "aria-invalid": "true", defaultValue: "ana@correo" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Lima" },
};

export const WithLabelAndFieldError: Story = {
  name: "With Label and FieldError",
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      {SURFACES.map((surface) => (
        <div
          key={surface.name}
          className={`flex flex-col gap-5 rounded-lg border p-5 ${surface.className}`}
        >
          <p className="font-mono text-caption text-muted-foreground">
            {surface.name}
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`name-${surface.name}`}>Nombre completo</Label>
            <Input
              id={`name-${surface.name}`}
              autoComplete="name"
              placeholder="Ana Torres"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`email-${surface.name}`} required>
              Correo electrónico
            </Label>
            <Input
              id={`email-${surface.name}`}
              type="email"
              required
              defaultValue="ana@correo"
              aria-invalid="true"
              aria-describedby={`email-${surface.name}-error`}
            />
            <FieldError id={`email-${surface.name}-error`}>
              Ingresa un correo válido, por ejemplo nombre@correo.com.
            </FieldError>
          </div>
        </div>
      ))}
    </div>
  ),
};
