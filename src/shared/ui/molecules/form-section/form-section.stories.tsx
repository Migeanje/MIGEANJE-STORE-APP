import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@/shared/ui/atoms/input";
import { Textarea } from "@/shared/ui/atoms/textarea";
import { FormField } from "@/shared/ui/molecules/form-field";
import { FormSection } from "./form-section";

const meta = {
  title: "Molecules/FormSection",
  component: FormSection,
  tags: ["autodocs"],
  args: {
    title: "1. Identificación del consumidor reclamante",
    children: (
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nombres" required>
          {(control) => <Input {...control} autoComplete="given-name" />}
        </FormField>
        <FormField label="Apellidos" required>
          {(control) => <Input {...control} autoComplete="family-name" />}
        </FormField>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        component:
          "A numbered part of a long form on a card: a region named by its heading (h2 by default, `title` size), an optional description and the fields. Used by the Hoja de Reclamación (sections 1–3 of Anexo I).",
      },
    },
  },
} satisfies Meta<typeof FormSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    title: "3. Detalle de la reclamación y pedido del consumidor",
    description: "Cuéntanos qué pasó y qué solución esperas.",
    children: (
      <FormField label="Detalle" required>
        {(control) => <Textarea {...control} />}
      </FormField>
    ),
  },
};
