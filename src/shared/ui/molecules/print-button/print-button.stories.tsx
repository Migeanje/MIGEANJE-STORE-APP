import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PrintButton } from "./print-button";

const meta = {
  title: "Molecules/PrintButton",
  component: PrintButton,
  tags: ["autodocs"],
  args: {
    children: "Imprimir o guardar como PDF",
    noScriptHint:
      "Para imprimirla o guardarla como PDF, usa la opción Imprimir de tu navegador.",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Opens the browser's print dialog (where “Save as PDF” also lives). Without JavaScript the hint replaces it (`noscript:` variant); neither prints (`print:hidden`).",
      },
    },
  },
} satisfies Meta<typeof PrintButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = {
  args: { variant: "primary", size: "md" },
};
