import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { FormField } from "@/shared/ui/molecules/form-field";
import { FormSection } from "@/shared/ui/molecules/form-section";
import { ComplaintBook } from "./complaint-book";

const meta = {
  title: "Templates/ComplaintBook",
  component: ComplaintBook,
  tags: ["autodocs"],
  args: {
    notice:
      "Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, Migeanje Store cuenta con un Libro de Reclamaciones virtual a tu disposición.",
    intro:
      "Completa esta Hoja de Reclamación para registrar tu reclamo o queja. Al enviarla, te mostramos tu constancia para imprimir y te enviamos una copia a tu correo.",
    provider: [
      { term: "Nombre comercial", details: "Migeanje Store" },
      { term: "Razón social o nombre", details: "Por definir" },
      { term: "RUC", details: "Por definir" },
      { term: "Domicilio", details: "Por definir" },
    ],
    legalNotes: [
      "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.",
      "El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual es improrrogable.",
    ],
    form: (
      <form aria-label="Hoja de Reclamación" className="flex flex-col gap-6">
        <FormSection title="1. Identificación del consumidor reclamante">
          <FormField label="Nombres" required>
            {(control) => <Input {...control} autoComplete="given-name" />}
          </FormField>
        </FormSection>
        <div>
          <Button type="button" size="lg">
            Enviar Hoja de Reclamación
          </Button>
        </div>
      </form>
    ),
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The virtual Libro de Reclamaciones page: title and legal aviso, the head of the Hoja de Reclamación (number and date assigned on submit, the provider's identification, the legal notes of Anexo I), an optional demo note and the form slot (the complaints module wires the real form).",
      },
    },
  },
} satisfies Meta<typeof ComplaintBook>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDemoNote: Story = {
  args: {
    demoNote:
      "Modo demostración: no enviamos correos reales. La copia de tu Hoja queda en un buzón de pruebas del servidor y se borra al reiniciarlo.",
  },
};
