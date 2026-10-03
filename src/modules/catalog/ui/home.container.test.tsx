import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockCatalog } from "@/modules/catalog/infrastructure/catalog.mock";
import { expectNoAxeViolations } from "@/test/a11y";
import { HomeContainer } from "./home.container";

vi.mock("server-only", () => ({}));

// The container reads the default data source (DATA_SOURCE=mock).
describe("HomeContainer", () => {
  it("points the hero to the first category", async () => {
    render(await HomeContainer());

    expect(
      screen.getByRole("link", { name: "Ver cargadores" }),
    ).toHaveAttribute("href", "/categorias/cargadores");
  });

  it("features six in-stock products from different categories", async () => {
    render(await HomeContainer());

    const featured = within(screen.getByRole("region", { name: "Destacados" }));
    const cards = featured.getAllByRole("article");
    expect(cards).toHaveLength(6);
    for (const card of cards) {
      expect(within(card).getByText("En stock")).toBeInTheDocument();
    }
    const hrefs = featured
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs.every((href) => href?.startsWith("/productos/"))).toBe(true);
    const categories = hrefs.map(
      (href) =>
        mockCatalog.products.find(
          (product) => `/productos/${product.slug}` === href,
        )?.category.slug,
    );
    expect(new Set(categories).size).toBe(6);
  });

  it("links every category with its product count", async () => {
    render(await HomeContainer());

    const tiles = within(
      screen.getByRole("region", { name: "Explora por categoría" }),
    ).getAllByRole("link");
    expect(tiles).toHaveLength(mockCatalog.categories.length);
    const chargers = mockCatalog.products.filter(
      (product) => product.category.slug === "cargadores",
    ).length;
    expect(tiles[0]).toHaveAccessibleName(`Cargadores ${chargers} productos`);
    expect(tiles[0]).toHaveAttribute("href", "/categorias/cargadores");
  });

  it("has no axe violations", async () => {
    const { container } = render(await HomeContainer());

    await expectNoAxeViolations(container);
  });
});
