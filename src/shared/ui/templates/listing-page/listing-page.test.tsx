import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductGrid } from "@/shared/ui/organisms/product-grid";
import { SAMPLE_PRODUCTS } from "@/shared/ui/organisms/product-grid/__fixtures__/products";
import { expectNoAxeViolations } from "@/test/a11y";
import { ListingPageTemplate } from "./listing-page";

describe("ListingPageTemplate", () => {
  it("titles the page with an h1, eyebrow and description", () => {
    render(
      <ListingPageTemplate
        eyebrow="Categoría"
        title="Cargadores"
        description="Cargadores de pared GaN."
      >
        <p>Resultados</p>
      </ListingPageTemplate>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Cargadores" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Categoría")).toBeInTheDocument();
    expect(screen.getByText("Cargadores de pared GaN.")).toBeInTheDocument();
    expect(screen.getByText("Resultados")).toBeInTheDocument();
  });

  it("announces the result count politely", () => {
    render(
      <ListingPageTemplate title="Cargadores" count="2 de 4 productos">
        <p>Resultados</p>
      </ListingPageTemplate>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("2 de 4 productos");
  });

  it("puts the filters column before the toolbar and results", () => {
    render(
      <ListingPageTemplate
        title="Cargadores"
        aside={<p>Filtros</p>}
        toolbar={<p>Ordenar</p>}
      >
        <p>Resultados</p>
      </ListingPageTemplate>,
    );

    const order = ["Filtros", "Ordenar", "Resultados"].map((text) =>
      screen.getByText(text),
    );
    expect(
      order[0]?.compareDocumentPosition(order[1] as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      order[1]?.compareDocumentPosition(order[2] as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ListingPageTemplate
        eyebrow="Categoría"
        title="Cargadores"
        count="6 productos"
        aside={<p>Filtros</p>}
        toolbar={<p>Ordenar</p>}
      >
        <ProductGrid products={SAMPLE_PRODUCTS} columns={3} headingLevel={2} />
      </ListingPageTemplate>,
    );

    await expectNoAxeViolations(container);
  });
});
