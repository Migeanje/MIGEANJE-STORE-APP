import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import placeholder from "@/shared/ui/molecules/product-card/__fixtures__/placeholder.svg";
import { ProductGallery } from "./product-gallery";

const IMAGE = {
  src: placeholder,
  alt: "Imagen referencial de un cargador",
  width: 640,
  height: 640,
};

const meta = {
  title: "Organisms/ProductGallery",
  component: ProductGallery,
  tags: ["autodocs"],
  args: { images: [IMAGE] },
  argTypes: { images: { control: false } },
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
          "Product page gallery: the main image over the warm amber glow, with concentric corners (rounded-lg frame, p-2, rounded-md well). With more than one image, thumbnail buttons (`aria-pressed`, named «Ver imagen 2 de 3») switch the main image; without JavaScript the first image shows.",
      },
    },
  },
} satisfies Meta<typeof ProductGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleImage: Story = {};

export const WithThumbnails: Story = {
  args: {
    images: [
      IMAGE,
      { ...IMAGE, alt: "Imagen referencial del cargador de lado" },
      { ...IMAGE, alt: "Imagen referencial del enchufe plegable" },
    ],
  },
};
