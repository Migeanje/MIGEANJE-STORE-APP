import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders a heading, a description and the actions", () => {
    render(
      <EmptyState
        title="No hay productos con estos filtros"
        description="Prueba quitando alguno."
      >
        <a href="/categorias/cables">Quitar filtros</a>
      </EmptyState>,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "No hay productos con estos filtros",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Prueba quitando alguno.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quitar filtros" })).toBeVisible();
  });

  it("supports another heading level and no description or actions", () => {
    const { container } = render(
      <EmptyState title="Sin resultados" headingLevel={3} />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Sin resultados" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <EmptyState title="Sin resultados" description="Prueba otra búsqueda.">
        <a href="/">Ir al inicio</a>
      </EmptyState>,
    );

    await expectNoAxeViolations(container);
  });
});
