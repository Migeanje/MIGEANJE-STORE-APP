import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { ActiveFilters } from "./active-filters";

const FILTERS = [
  { label: "Anker", removeHref: "/categorias/cargadores?pantalla=si" },
  {
    label: "Potencia máxima: 60–140 W",
    removeHref: "/categorias/cargadores?marca=anker&pantalla=si",
  },
  { label: "Pantalla", removeHref: "/categorias/cargadores?marca=anker" },
];

describe("ActiveFilters", () => {
  it("lists each active filter as a link that removes it", () => {
    render(
      <ActiveFilters filters={FILTERS} clearHref="/categorias/cargadores" />,
    );

    const list = screen.getByRole("list", { name: "Filtros activos" });
    const links = within(list).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Quitar filtro: Anker",
      "Quitar filtro: Potencia máxima: 60–140 W",
      "Quitar filtro: Pantalla",
    ]);
    expect(links[0]).toHaveAccessibleName("Quitar filtro: Anker");
    expect(links[0]).toHaveAttribute(
      "href",
      "/categorias/cargadores?pantalla=si",
    );
  });

  it("links to clear every filter", () => {
    render(
      <ActiveFilters filters={FILTERS} clearHref="/categorias/cargadores" />,
    );

    expect(
      screen.getByRole("link", { name: "Quitar filtros" }),
    ).toHaveAttribute("href", "/categorias/cargadores");
  });

  it("renders nothing without active filters", () => {
    const { container } = render(
      <ActiveFilters filters={[]} clearHref="/categorias/cargadores" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ActiveFilters filters={FILTERS} clearHref="/categorias/cargadores" />,
    );

    await expectNoAxeViolations(container);
  });
});
