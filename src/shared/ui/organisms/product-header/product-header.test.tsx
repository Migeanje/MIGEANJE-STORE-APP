import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { ProductHeader, type ProductHeaderProps } from "./product-header";

const PROPS: ProductHeaderProps = {
  brand: { name: "Anker", href: "/marcas/anker" },
  name: "Prime Charger 100W, 3 puertos",
  model: "A2688",
  summary: "Tres puertos para cargar tu laptop, celular y audífonos.",
  category: { name: "Cargadores", href: "/categorias/cargadores" },
};

describe("ProductHeader", () => {
  it("names the page with the product as the h1", () => {
    render(<ProductHeader {...PROPS} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Prime Charger 100W, 3 puertos",
      }),
    ).toBeInTheDocument();
  });

  it("links the brand (as text) to its page and the category eyebrow to the category", () => {
    render(<ProductHeader {...PROPS} />);

    expect(
      screen.getByRole("link", { name: "Anker: ver todos sus productos" }),
    ).toHaveAttribute("href", "/marcas/anker");
    expect(screen.getByRole("link", { name: "Cargadores" })).toHaveAttribute(
      "href",
      "/categorias/cargadores",
    );
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows the model in Geist Mono and the summary", () => {
    render(<ProductHeader {...PROPS} />);

    expect(screen.getByText("Modelo A2688")).toHaveClass("font-mono");
    expect(screen.getByText(PROPS.summary)).toBeInTheDocument();
  });

  it("leaves out the model and category when missing", () => {
    render(<ProductHeader {...PROPS} model={undefined} category={undefined} />);

    expect(screen.queryByText(/Modelo/)).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(<ProductHeader {...PROPS} />);

    await expectNoAxeViolations(container);
  });
});
