import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { CHARGER_FILTERS } from "./__fixtures__/groups";
import { FilterPanel, FilterSheet } from "./filter-panel";

const meta = {
  title: "Organisms/FilterPanel",
  component: FilterPanel,
  tags: ["autodocs"],
  args: {
    action: "/categorias/cargadores",
    groups: CHARGER_FILTERS,
    hiddenFields: [{ name: "orden", value: "precio-asc" }],
    activeCount: 2,
    clearHref: "/categorias/cargadores?orden=precio-asc",
  },
  argTypes: {
    groups: { control: false },
    hiddenFields: { control: false },
  },
  render: (args) => (
    <div className="max-w-64">
      <FilterPanel {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'Category filters as a native GET form: it works before hydration and without JavaScript, and navigates on the client when the page passes `onApply`. Checkbox groups (brand, availability, options, features) show their counts and light up in amber when checked ("encendido", with a check mark); number ranges take "Desde"/"Hasta" with the available bounds as a hint. From `lg` it is a column; on phones `FilterSheet` opens the same form in a sheet, and without JavaScript the inline panel shows when `#filtros` is targeted.',
      },
    },
  },
} satisfies Meta<typeof FilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Panel: Story = {
  name: "Panel (from lg)",
  globals: { viewport: { value: "desktop", isRotated: false } },
};

export const NoActiveFilters: Story = {
  name: "Nothing selected",
  globals: { viewport: { value: "desktop", isRotated: false } },
  args: {
    activeCount: 0,
    groups: CHARGER_FILTERS.map((group) =>
      group.kind === "range"
        ? { ...group, to: { name: group.to.name } }
        : {
            ...group,
            options: group.options.map((option) => ({
              ...option,
              checked: false,
            })),
          },
    ),
  },
};

export const MobileSheet: Story = {
  name: "Phone: sheet open",
  globals: { viewport: { value: "mobile2", isRotated: false } },
  render: (args) => <FilterSheet {...args} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Filtros, 2 activos" }),
    );
    // The sheet renders in a portal on document.body.
    await expect(
      within(document.body).getByRole("dialog", { name: "Filtros" }),
    ).toBeVisible();
  },
};
