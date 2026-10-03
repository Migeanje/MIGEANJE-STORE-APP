import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SortSelect } from "@/shared/ui/molecules/sort-select";
import { ActiveFilters } from "@/shared/ui/organisms/active-filters";
import { FilterPanel, FilterSheet } from "@/shared/ui/organisms/filter-panel";
import { CHARGER_FILTERS } from "@/shared/ui/organisms/filter-panel/__fixtures__/groups";
import { ProductGrid } from "@/shared/ui/organisms/product-grid";
import { SAMPLE_PRODUCTS } from "@/shared/ui/organisms/product-grid/__fixtures__/products";
import { ListingPageTemplate } from "./listing-page";

const FILTERS = {
  action: "/categorias/cargadores",
  groups: CHARGER_FILTERS,
  activeCount: 2,
  clearHref: "/categorias/cargadores",
};

const meta = {
  title: "Templates/ListingPage",
  component: ListingPageTemplate,
  tags: ["autodocs"],
  args: {
    eyebrow: "Categoría",
    title: "Cargadores",
    count: "4 de 6 productos",
    aside: <FilterPanel {...FILTERS} />,
    toolbar: (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterSheet {...FILTERS} />
          <SortSelect
            action="/categorias/cargadores"
            name="orden"
            value="relevancia"
            options={[
              { value: "relevancia", label: "Relevancia" },
              { value: "precio-asc", label: "Precio: menor a mayor" },
            ]}
            className="ml-auto"
          />
        </div>
        <ActiveFilters
          filters={[
            {
              label: "Anker",
              removeHref: "/categorias/cargadores?pantalla=si",
            },
            {
              label: "Pantalla",
              removeHref: "/categorias/cargadores?marca=anker",
            },
          ]}
          clearHref="/categorias/cargadores"
        />
      </>
    ),
    children: (
      <ProductGrid
        products={SAMPLE_PRODUCTS.slice(0, 4)}
        columns={3}
        headingLevel={2}
      />
    ),
  },
  argTypes: {
    aside: { control: false },
    toolbar: { control: false },
    children: { control: false },
    description: { control: false },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Layout of the listing pages (category, brand, search): header with the h1 and the result count (a polite status, so client-side filter changes are announced), a filters column from `lg`, and the toolbar (phone filters, sort, active filters) above the results.",
      },
    },
  },
} satisfies Meta<typeof ListingPageTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CategoryDesktop: Story = {
  name: "Category, desktop",
  globals: { viewport: { value: "desktop", isRotated: false } },
};

export const CategoryMobile: Story = {
  name: "Category, phone",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const WithoutFilters: Story = {
  name: "Brand or search (no filters column)",
  args: {
    eyebrow: "Marca",
    title: "Anker",
    description: "Los productos de Anker en nuestra tienda, por categoría.",
    count: "6 productos",
    aside: undefined,
    toolbar: undefined,
    children: <ProductGrid products={SAMPLE_PRODUCTS} headingLevel={2} />,
  },
};
