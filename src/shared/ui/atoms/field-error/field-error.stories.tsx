import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FieldError } from "./field-error";

// Class names are written in full so Tailwind detects them.
const SURFACES = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "surface-raised", className: "bg-surface-raised" },
] as const;

const meta = {
  title: "Atoms/FieldError",
  component: FieldError,
  tags: ["autodocs"],
  args: {
    id: "email-error",
    children: "Ingresa un correo válido, por ejemplo nombre@correo.com.",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Error message for one field, in `destructive` with a decorative icon. Requires an `id` so the field can point at it with `aria-describedby`; renders nothing without a message. The FormField molecule wires it to the input.",
      },
    },
  },
} satisfies Meta<typeof FieldError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    id: "address-error",
    children:
      "Ingresa una dirección de entrega con calle, número y distrito, por ejemplo Av. Arequipa 1234, Miraflores.",
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export const OnSurfaces: Story = {
  name: "On every surface",
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      {SURFACES.map((surface) => (
        <div
          key={surface.name}
          className={`flex flex-col gap-3 rounded-lg border p-5 ${surface.className}`}
        >
          <p className="font-mono text-caption text-muted-foreground">
            {surface.name}
          </p>
          <FieldError id={`phone-error-${surface.name}`}>
            Ingresa un número de 9 dígitos.
          </FieldError>
        </div>
      ))}
    </div>
  ),
};
