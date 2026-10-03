import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { SAMPLE_PRODUCTS } from "./__fixtures__/products";
import { ProductGrid } from "./product-grid";

/** The grid itself: cards hold their own spec lists. */
function getGrid(): HTMLElement {
  const [grid] = screen.getAllByRole("list");
  if (grid === undefined) throw new Error("No list rendered");
  return grid;
}

describe("ProductGrid", () => {
  it("lists one product card per product, in order", () => {
    render(<ProductGrid products={SAMPLE_PRODUCTS} />);

    const items = [...getGrid().children];
    expect(items).toHaveLength(SAMPLE_PRODUCTS.length);
    for (const item of items) {
      expect(item.tagName).toBe("LI");
      expect(within(item as HTMLElement).getByRole("article")).toBeVisible();
    }
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual(SAMPLE_PRODUCTS.map(({ href }) => href));
  });

  it("titles the cards at the given heading level", () => {
    render(<ProductGrid products={SAMPLE_PRODUCTS} headingLevel={2} />);

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
      SAMPLE_PRODUCTS.length,
    );
  });

  it("uses three columns next to a filters column, four otherwise", () => {
    const { rerender } = render(<ProductGrid products={SAMPLE_PRODUCTS} />);
    expect(getGrid()).toHaveAttribute("data-columns", "4");
    expect(getGrid()).toHaveClass("lg:grid-cols-4");

    rerender(<ProductGrid products={SAMPLE_PRODUCTS} columns={3} />);
    expect(getGrid()).toHaveAttribute("data-columns", "3");
    expect(getGrid()).toHaveClass("lg:grid-cols-3");
  });

  it("renders nothing without products", () => {
    const { container } = render(<ProductGrid products={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("has no axe violations", async () => {
    const { container } = render(<ProductGrid products={SAMPLE_PRODUCTS} />);

    await expectNoAxeViolations(container);
  });
});
