import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SAMPLE_PRODUCTS } from "@/shared/ui/organisms/product-grid/__fixtures__/products";
import { expectNoAxeViolations } from "@/test/a11y";
import { ProductSection } from "./product-section";

const PRODUCTS = SAMPLE_PRODUCTS.slice(0, 3);

describe("ProductSection", () => {
  it("is a region named by its heading, with the products one level below", () => {
    render(<ProductSection title="Cargadores" products={PRODUCTS} />);

    const region = screen.getByRole("region", { name: "Cargadores" });
    expect(
      within(region).getByRole("heading", { level: 2, name: "Cargadores" }),
    ).toBeInTheDocument();
    expect(within(region).getAllByRole("heading", { level: 3 })).toHaveLength(
      3,
    );
    expect(within(region).getAllByRole("article")).toHaveLength(3);
  });

  it("links to see more when given an action", () => {
    render(
      <ProductSection
        title="Cargadores"
        products={PRODUCTS}
        action={{
          href: "/categorias/cargadores?marca=anker",
          label: "Ver cargadores de Anker",
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Ver cargadores de Anker" }),
    ).toHaveAttribute("href", "/categorias/cargadores?marca=anker");
  });

  it("supports another outline level", () => {
    render(
      <ProductSection
        title="Cargadores"
        products={PRODUCTS}
        headingLevel={3}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Cargadores" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(3);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ProductSection
        title="Cargadores"
        products={PRODUCTS}
        action={{ href: "/categorias/cargadores", label: "Ver cargadores" }}
      />,
    );

    await expectNoAxeViolations(container);
  });
});
