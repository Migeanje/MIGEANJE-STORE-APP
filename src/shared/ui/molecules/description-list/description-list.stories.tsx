import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DescriptionList } from "./description-list";

const meta = {
  title: "Molecules/DescriptionList",
  component: DescriptionList,
  tags: ["autodocs"],
  args: {
    items: [
      { term: "Nombre", details: "Ana Pérez Quispe" },
      { term: "Documento", details: "DNI 46027897", mono: true },
      {
        term: "Domicilio",
        details: ["Av. Larco 1234, dpto. 501", "Miraflores, Lima, Lima"],
      },
      { term: "Correo electrónico", details: "ana@correo.pe" },
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          "Labelled values (`dl`): a muted term above each value, in one or two columns. Multi-line values (`string[]`) put each line on its own line; `mono` is for data (numbers, codes) and `preformatted` keeps the line breaks of long typed text.",
      },
    },
  },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneColumn: Story = {};

export const TwoColumns: Story = { args: { columns: 2 } };

export const LongText: Story = {
  args: {
    items: [
      {
        term: "Detalle",
        details:
          "El cargador dejó de funcionar a la semana de recibirlo.\nProbé con dos cables distintos y no carga.",
        preformatted: true,
      },
    ],
  },
};
