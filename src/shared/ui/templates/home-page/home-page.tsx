import { type ReactNode, useId } from "react";
import { AvailabilityIndicator } from "@/shared/ui/atoms/availability-indicator";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import type { ProductCardProps } from "@/shared/ui/molecules/product-card";
import {
  type CategoryTile,
  CategoryTiles,
} from "@/shared/ui/organisms/category-tiles";
import {
  type Feature,
  FeatureStrip,
} from "@/shared/ui/organisms/feature-strip";
import { HomeHero } from "@/shared/ui/organisms/home-hero";
import { ProductGrid } from "@/shared/ui/organisms/product-grid";
import { ScrollReveal } from "@/shared/ui/organisms/scroll-reveal";

// DRAFT COPY (pending owner review): hero, "Por qué Migeanje" and the
// "En importación" explainer. Neutral Peruvian Spanish with "tú".
const HERO = {
  headline: "Tecnología elegida con criterio",
  lead: "Cargadores, cables, power banks y más: solo lo que le recomendaríamos a un amigo, con precios en soles y garantía en Perú.",
};

const WHY_MIGEANJE: readonly Feature[] = [
  {
    title: "Curaduría",
    description:
      "Elegimos pocos productos y de marcas con buen respaldo. Si no lo usaríamos nosotros, no lo vendemos.",
  },
  {
    title: "Reseñas honestas",
    description:
      "Te contamos para quién es cada producto y para quién no, con una rúbrica clara y sin letra pequeña.",
  },
  {
    title: "Garantía local",
    description:
      "Pagas en soles y, si algo falla, lo resolvemos aquí en Perú, sin trámites con el extranjero.",
  },
];

const BACKORDER_STEPS = [
  {
    title: "Compras con el plazo a la vista",
    description:
      "Ves cuándo llega antes de pagar, en la ficha y en el carrito.",
  },
  {
    title: "Lo importamos para ti",
    description:
      "Hacemos el pedido al proveedor y puedes seguir el estado de tu orden en línea.",
  },
  {
    title: "Lo recibes en casa",
    description:
      "Cuando llega a Perú, lo despachamos a la dirección que elijas.",
  },
] as const;

export type HomePageTemplateProps = {
  /** Hero call to action, e.g. the first category. */
  heroCta: { href: string; label: string };
  /** "Destacados": in-stock products. The section is left out when empty. */
  featured: readonly ProductCardProps[];
  /** Every category with its product count. */
  categories: readonly CategoryTile[];
};

function HomeSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Heading id={headingId} level={2}>
          {title}
        </Heading>
        {description ? <Text tone="muted">{description}</Text> : null}
      </div>
      {children}
    </section>
  );
}

function BackorderExplainer() {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-10 rounded-lg border bg-card p-6 sm:p-10 lg:grid-cols-2"
    >
      <div className="flex flex-col items-start gap-4">
        <AvailabilityIndicator status="backorder">
          En importación · llega en 15–20 días
        </AvailabilityIndicator>
        <Heading id={headingId} level={2} className="text-balance">
          ¿Qué significa «En importación»?
        </Heading>
        <Text tone="muted" className="max-w-prose text-pretty">
          Algunos productos no los tenemos en stock, pero igual puedes
          comprarlos: los traemos para ti y suelen llegar en 15 a 20 días
          hábiles. Siempre verás el plazo antes de pagar.
        </Text>
      </div>
      <ol className="flex flex-col gap-6">
        {BACKORDER_STEPS.map(({ title, description }, index) => (
          <li key={title} className="flex gap-4">
            <span
              aria-hidden="true"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-primary font-mono text-body-sm text-primary"
            >
              {index + 1}
            </span>
            <div className="flex flex-col gap-1">
              <Text className="font-medium">{title}</Text>
              <Text size="body-sm" tone="muted">
                {description}
              </Text>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * The home page: hero (h1, warm glow, call to action), "Destacados", the
 * category tiles, "Por qué Migeanje" and what "En importación" means.
 * Sections below the hero reveal on scroll (never under reduced motion).
 */
export function HomePageTemplate({
  heroCta,
  featured,
  categories,
}: HomePageTemplateProps) {
  return (
    <div className="flex flex-col pb-24">
      <HomeHero headline={HERO.headline} lead={HERO.lead} cta={heroCta} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 sm:px-8 lg:gap-28">
        {featured.length > 0 ? (
          <ScrollReveal>
            <HomeSection
              title="Destacados"
              description="En stock y listos para enviar."
            >
              <ProductGrid products={featured} />
            </HomeSection>
          </ScrollReveal>
        ) : null}
        <ScrollReveal>
          <HomeSection title="Explora por categoría">
            <CategoryTiles categories={categories} />
          </HomeSection>
        </ScrollReveal>
        <ScrollReveal>
          <FeatureStrip title="Por qué Migeanje" items={WHY_MIGEANJE} />
        </ScrollReveal>
        <ScrollReveal>
          <BackorderExplainer />
        </ScrollReveal>
      </div>
    </div>
  );
}
