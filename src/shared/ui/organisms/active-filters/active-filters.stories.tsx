import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActiveFilters } from "./active-filters";

const meta = {
  title: "Organisms/ActiveFilters",
  component: ActiveFilters,
  tags: ["autodocs"],
  args: {
    filters: [
      { label: "Anker", removeHref: "/categorias/cargadores?pantalla=si" },
      {
        label: "Potencia máxima: 60–140 W",
        removeHref: "/categorias/cargadores?marca=anker&pantalla=si",
      },
      { label: "Pantalla", removeHref: "/categorias/cargadores?marca=anker" },
    ],
    clearHref: "/categorias/cargadores",
  },
  argTypes: { filters: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'The applied filters as chips (Chip styles); each is a link to the listing without that filter, named "Quitar filtro: …", plus "Quitar filtros". Works without JavaScript; renders nothing when no filter is active.',
      },
    },
  },
} satisfies Meta<typeof ActiveFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
