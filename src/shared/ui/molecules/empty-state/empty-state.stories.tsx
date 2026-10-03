import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { Button } from "@/shared/ui/atoms/button";
import { EmptyState } from "./empty-state";

const meta = {
  title: "Molecules/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    title: "No hay productos con estos filtros",
    description: "Prueba quitando alguno de los filtros para ver más opciones.",
    children: (
      <Button asChild>
        <Link href="/categorias/cargadores">Quitar filtros</Link>
      </Button>
    ),
  },
  argTypes: {
    headingLevel: { control: "inline-radio", options: [2, 3] },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Turns a dead end (no results, empty category) into a next step: a title, one line and actions, in a dashed panel.",
      },
    },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoFilteredResults: Story = {
  name: "No filtered results",
};

export const WithoutActions: Story = {
  args: {
    title: "Pronto tendremos productos aquí",
    description: "Todavía no hay productos en esta categoría.",
    children: undefined,
  },
};
