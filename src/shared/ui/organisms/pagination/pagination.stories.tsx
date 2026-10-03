import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pagination } from "./pagination";

const meta = {
  title: "Organisms/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  args: {
    page: 2,
    pageCount: 3,
    hrefForPage: (page: number) =>
      page === 1 ? "/categorias/cables" : `/categorias/cables?pagina=${page}`,
  },
  argTypes: {
    page: { control: { type: "number", min: 1, step: 1 } },
    pageCount: { control: { type: "number", min: 1, step: 1 } },
    hrefForPage: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Page links in a "Paginación" navigation: previous and next (icons with visually hidden names), numbered pages and gaps when there are many. The current page has `aria-current="page"` and is lit in amber. Renders nothing for a single page.',
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FewPages: Story = {};

export const ManyPages: Story = {
  args: { page: 5, pageCount: 12 },
};

export const FirstPage: Story = {
  args: { page: 1, pageCount: 3 },
};
