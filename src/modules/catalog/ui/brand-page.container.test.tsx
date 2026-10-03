import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockCatalog } from "@/modules/catalog/infrastructure/catalog.mock";
import { expectNoAxeViolations } from "@/test/a11y";
import { BrandPageContainer } from "./brand-page.container";

vi.mock("server-only", () => ({}));

// The container reads the default data source (DATA_SOURCE=mock).
const ankerProducts = mockCatalog.products.filter(
  (product) => product.brand.slug === "anker",
);
const ankerCategories = mockCatalog.categories.filter((category) =>
  ankerProducts.some((product) => product.category.slug === category.slug),
);

describe("BrandPageContainer", () => {
  it("titles the page with the brand name as text, its count and a description", async () => {
    render(await BrandPageContainer({ slug: "anker" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Anker" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      `${ankerProducts.length} productos`,
    );
    expect(
      screen.getByText(/Los productos de Anker que elegimos para la tienda/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /logo/i })).toBeNull();
  });

  it("groups the products by category, in catalog order", async () => {
    render(await BrandPageContainer({ slug: "anker" }));

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(ankerCategories.map(({ name }) => name));
    expect(screen.getAllByRole("article")).toHaveLength(ankerProducts.length);
  });

  it("links each group to its category filtered by the brand", async () => {
    render(await BrandPageContainer({ slug: "anker" }));

    const chargers = screen.getByRole("region", { name: "Cargadores" });
    expect(
      within(chargers).getByRole("link", { name: "Ver cargadores de Anker" }),
    ).toHaveAttribute("href", "/categorias/cargadores?marca=anker");
  });

  it("answers 404 for an unknown brand", async () => {
    await expect(BrandPageContainer({ slug: "xiaomi" })).rejects.toHaveProperty(
      "digest",
      expect.stringContaining("404"),
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(await BrandPageContainer({ slug: "anker" }));

    await expectNoAxeViolations(container);
  });
});
