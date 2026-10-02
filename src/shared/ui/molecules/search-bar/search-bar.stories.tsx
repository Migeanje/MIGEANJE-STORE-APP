import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SearchBar } from "./search-bar";

const meta = {
  title: "Molecules/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  args: {
    onSearch: fn(),
  },
  argTypes: {
    defaultValue: { control: "text" },
    placeholder: { control: "text" },
    label: { control: "text" },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Product search: `<form role="search">` with a visually hidden label ("Buscar productos"), a `type="search"` field, a clear button while there is text ("Borrar búsqueda", returns focus to the field) and a 44px submit button ("Buscar", decorative icon). Calls `onSearch` with the trimmed query and never with an empty one; routing belongs to the caller.',
      },
    },
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithQuery: Story = {
  name: "With a query",
  args: { defaultValue: "cargador GaN 65 W" },
};

export const InHeader: Story = {
  name: "In a header (375px and up)",
  render: (args) => (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
      <p className="text-body font-medium">Migeanje Store</p>
      <SearchBar {...args} className="sm:flex-1" />
    </div>
  ),
};
