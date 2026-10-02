import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import placeholder from "./__fixtures__/placeholder.svg";
import { ProductCard, type ProductCardProps } from "./product-card";

const IMAGE = {
  src: placeholder,
  alt: "Cargador de pared con dos puertos USB-C y uno USB-A",
  width: 480,
  height: 480,
};

const IN_STOCK: ProductCardProps = {
  href: "/productos/cargador-gan-65w-3-puertos",
  image: IMAGE,
  brand: "Anker",
  name: "Cargador GaN 65 W, 3 puertos",
  specs: ["65 W", "GaN", "USB-C"],
  price: { amount: 18900 },
  availability: { status: "in_stock", label: "En stock" },
};

const BACKORDER: ProductCardProps = {
  href: "/productos/power-bank-20000-mah",
  image: { ...IMAGE, alt: "Power bank compacta con pantalla de carga" },
  brand: "Baseus",
  name: "Power bank 20 000 mAh, 30 W",
  specs: ["20 000 mAh", "30 W", "PD 3.0"],
  price: { amount: 24900 },
  availability: {
    status: "backorder",
    label: "En importación · llega en 15–20 días",
  },
};

const UNAVAILABLE: ProductCardProps = {
  href: "/productos/cable-usb-c-2m",
  image: { ...IMAGE, alt: "Cable USB-C a USB-C trenzado, enrollado" },
  brand: "Ugreen",
  name: "Cable USB-C a USB-C, 2 m",
  specs: ["100 W", "USB-C"],
  price: { amount: 5900 },
  availability: { status: "unavailable", label: "Agotado" },
};

const ON_SALE: ProductCardProps = {
  href: "/productos/cargador-inalambrico-15w",
  image: { ...IMAGE, alt: "Base de carga inalámbrica circular" },
  brand: "Belkin",
  name: "Cargador inalámbrico 15 W",
  specs: ["15 W", "Qi2"],
  price: { amount: 12990, compareAt: 15990 },
  availability: { status: "in_stock", label: "En stock" },
};

const meta = {
  title: "Molecules/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
  args: IN_STOCK,
  argTypes: {
    headingLevel: { control: "inline-radio", options: [2, 3, 4] },
    image: { control: false },
    href: { control: false },
  },
  // One card at a listing-cell width; the Grid story renders its own layout.
  render: (args) => (
    <div className="max-w-xs">
      <ProductCard {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        component:
          "Listing card. The transparent product cutout sits on a warm amber glow (radial, low alpha, `primary`) that turns up on hover and focus (`--duration-fast`, `ease-out`; instant with reduced motion). Concentric corners: `rounded-lg` card with `p-2` around a `rounded-md` image well. The product name link is stretched over the whole card (one link, no nested controls); the card shows the keyboard focus ring. Brand is plain text, specs are mono Tags (up to 3), prices come from céntimos. No add-to-cart button: that belongs to organisms.",
      },
    },
  },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InStock: Story = {
  name: "In stock",
};

export const Backorder: Story = {
  args: BACKORDER,
};

export const Unavailable: Story = {
  args: UNAVAILABLE,
};

export const WithCompareAt: Story = {
  name: "With compareAt",
  args: ON_SALE,
};

export const LongName: Story = {
  name: "Long name (2-line clamp)",
  args: {
    name: "Cargador GaN 140 W con 4 puertos (3 × USB-C, 1 × USB-A), carga rápida PD 3.1 para laptop, tablet y celular",
  },
};

export const Grid: Story = {
  name: "Responsive grid (1 / 2 / 4 columns)",
  render: () => (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[IN_STOCK, BACKORDER, ON_SALE, UNAVAILABLE].map((product) => (
        <li key={String(product.href)}>
          <ProductCard {...product} />
        </li>
      ))}
    </ul>
  ),
};
