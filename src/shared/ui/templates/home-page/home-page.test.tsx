import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SAMPLE_PRODUCTS } from "@/shared/ui/organisms/product-grid/__fixtures__/products";
import { expectNoAxeViolations } from "@/test/a11y";
import { HomePageTemplate, type HomePageTemplateProps } from "./home-page";

const PROPS: HomePageTemplateProps = {
  heroCta: { href: "/categorias/cargadores", label: "Ver cargadores" },
  featured: SAMPLE_PRODUCTS,
  categories: [
    { href: "/categorias/cargadores", name: "Cargadores", meta: "3 productos" },
    { href: "/categorias/cables", name: "Cables", meta: "2 productos" },
  ],
};

function region(name: string): HTMLElement {
  return screen.getByRole("region", { name });
}

describe("HomePageTemplate", () => {
  it("opens with the hero: one h1 and a call to action to a category", () => {
    render(<HomePageTemplate {...PROPS} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Ver cargadores" }),
    ).toHaveAttribute("href", "/categorias/cargadores");
  });

  it("shows the featured products as a grid of cards", () => {
    render(<HomePageTemplate {...PROPS} />);

    const featured = region("Destacados");
    expect(within(featured).getAllByRole("article")).toHaveLength(
      SAMPLE_PRODUCTS.length,
    );
  });

  it("links every category with its product count", () => {
    render(<HomePageTemplate {...PROPS} />);

    const categories = region("Explora por categoría");
    expect(
      within(categories).getByRole("link", { name: "Cargadores 3 productos" }),
    ).toHaveAttribute("href", "/categorias/cargadores");
  });

  it("explains why to buy here and what backorder means", () => {
    render(<HomePageTemplate {...PROPS} />);

    expect(
      within(region("Por qué Migeanje")).getAllByRole("heading", { level: 3 }),
    ).toHaveLength(3);
    const backorder = region("¿Qué significa «En importación»?");
    expect(within(backorder).getByText(/15 a 20 días hábiles/)).toBeVisible();
    expect(
      within(backorder).getByText("En importación · llega en 15–20 días"),
    ).toBeInTheDocument();
  });

  it("leaves the featured section out when nothing is in stock", () => {
    render(<HomePageTemplate {...PROPS} featured={[]} />);

    expect(screen.queryByRole("region", { name: "Destacados" })).toBeNull();
  });

  it("keeps a single-level outline under the h1", () => {
    render(<HomePageTemplate {...PROPS} />);

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual([
      "Destacados",
      "Explora por categoría",
      "Por qué Migeanje",
      "¿Qué significa «En importación»?",
    ]);
  });

  it("has no axe violations", async () => {
    const { container } = render(<HomePageTemplate {...PROPS} />);

    await expectNoAxeViolations(container);
  });
});
