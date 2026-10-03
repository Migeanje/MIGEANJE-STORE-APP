import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, ShoppingCart } from "lucide-react";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import placeholder from "@/shared/ui/molecules/product-card/__fixtures__/placeholder.svg";
import { QuantityStepper } from "@/shared/ui/molecules/quantity-stepper";
import { SpecList } from "@/shared/ui/molecules/spec-list";
import { ExpertReview } from "@/shared/ui/organisms/expert-review";
import { SAMPLE_REVIEW } from "@/shared/ui/organisms/expert-review/__fixtures__/review";
import { ProductGallery } from "@/shared/ui/organisms/product-gallery";
import { SAMPLE_PRODUCTS } from "@/shared/ui/organisms/product-grid/__fixtures__/products";
import { ProductHeader } from "@/shared/ui/organisms/product-header";
import { ProductSection } from "@/shared/ui/organisms/product-section";
import { PurchasePanel } from "@/shared/ui/organisms/purchase-panel";
import { VariantSelector } from "@/shared/ui/organisms/variant-selector";
import { COLOR_GROUP } from "@/shared/ui/organisms/variant-selector/__fixtures__/groups";
import { ProductPageTemplate } from "./product-page";

const IMAGE = {
  src: placeholder,
  alt: "Imagen referencial de Nano Charger 45W Smart Display",
  width: 640,
  height: 640,
};

const SPECS = [
  { label: "Potencia máxima", value: "45", unit: "W" },
  { label: "Puertos USB-C", value: "1" },
  { label: "Protocolos de carga", value: "USB PD, PPS" },
  { label: "Pantalla", value: "Sí" },
  { label: "Peso", value: "75", unit: "g" },
];

const BUY = (
  <div className="flex flex-col gap-3">
    <QuantityStepper label="Cantidad" max={2} />
    <Button size="lg" leadingIcon={<ShoppingCart />}>
      Agregar al carrito
    </Button>
  </div>
);

const meta = {
  title: "Templates/ProductPage",
  component: ProductPageTemplate,
  tags: ["autodocs"],
  args: {
    gallery: <ProductGallery images={[IMAGE]} />,
    header: (
      <ProductHeader
        brand={{ name: "Anker", href: "/marcas/anker" }}
        name="Nano Charger 45W Smart Display"
        model="A121D"
        summary="Cargador USB-C de 45 W del tamaño de un cubo, con pantalla que muestra la potencia y la temperatura mientras cargas."
        category={{ name: "Cargadores", href: "/categorias/cargadores" }}
      />
    ),
    options: <VariantSelector groups={[COLOR_GROUP]} />,
    purchase: (
      <PurchasePanel
        price={{ amount: 24890 }}
        availability={{
          status: "backorder",
          label: "En importación · llega en 15–20 días",
        }}
        note="En importación: lo pedimos para ti y llega en 15–20 días; pagas hoy y te avisamos en cada paso."
        sku="ANK-A121D-BLK"
      >
        {BUY}
      </PurchasePanel>
    ),
    children: (
      <>
        <section className="flex flex-col gap-4">
          <Heading level={2}>Especificaciones</Heading>
          <SpecList specs={SPECS} />
        </section>
        <ExpertReview {...SAMPLE_REVIEW} />
      </>
    ),
    related: (
      <ProductSection
        title="También te puede interesar"
        products={SAMPLE_PRODUCTS.slice(0, 4)}
      />
    ),
  },
  argTypes: {
    gallery: { control: false },
    header: { control: false },
    options: { control: false },
    purchase: { control: false },
    children: { control: false },
    related: { control: false },
  },
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component:
          "Product page layout, mobile first: gallery, header, variant options, buy box, specs and expert review, related products. From `lg`, two columns: gallery and details on the left; header, options and the buy box on the right, where the buy box sticks below the site header.",
      },
    },
  },
} satisfies Meta<typeof ProductPageTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Backorder: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const NotifyMe: Story = {
  name: "Unavailable (Avísame)",
  args: {
    options: undefined,
    purchase: (
      <PurchasePanel
        price={{ amount: 119890 }}
        availability={{ status: "unavailable", label: "Agotado" }}
        sku="APL-MFHP4"
      >
        <Button size="lg" leadingIcon={<Bell />}>
          Avísame cuando llegue
        </Button>
      </PurchasePanel>
    ),
    related: undefined,
  },
};
