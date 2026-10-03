import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { ComparePageContainer } from "./compare-page.container";

vi.mock("server-only", () => ({}));

vi.mock("./category-shortcuts.container", () => ({
  CategoryShortcutsContainer: () => (
    <nav aria-label="Explora por categoría">Categorías</nav>
  ),
}));

// The container reads the default data source (DATA_SOURCE=mock).
const CHARGERS =
  "anker-prime-charger-100w-3-puertos,anker-prime-charger-160w-3-puertos-smart-display";
const POWER_BANK = "anker-prime-power-bank-20k-220w";

async function renderPage(searchParams: Record<string, string>) {
  return render(await ComparePageContainer({ searchParams }));
}

describe("ComparePageContainer", () => {
  it("compares two chargers side by side", async () => {
    await renderPage({ productos: CHARGERS });

    expect(
      screen.getByRole("heading", { level: 1, name: "Comparar cargadores" }),
    ).toBeInTheDocument();
    const table = screen.getByRole("region", {
      name: "Comparación de 2 productos",
    });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(2);
    expect(
      within(table).getByRole("rowheader", {
        name: "Potencia máxima (valores distintos)",
      }),
    ).toBeInTheDocument();
  });

  it("toggles 'only the differences' with a link", async () => {
    const all = await renderPage({ productos: CHARGERS });

    expect(
      screen.getByRole("link", { name: "Mostrar solo diferencias" }),
    ).toHaveAttribute("href", `/comparar?productos=${CHARGERS}&diferencias=si`);
    all.unmount();

    await renderPage({ productos: CHARGERS, diferencias: "si" });

    expect(
      screen.getByRole("link", { name: "Mostrar todas las especificaciones" }),
    ).toHaveAttribute("href", `/comparar?productos=${CHARGERS}`);
    expect(screen.getByRole("status")).toHaveTextContent(
      /son diferentes|es diferente/,
    );
  });

  it("explains products of different categories, with next steps", async () => {
    await renderPage({
      productos: `anker-prime-charger-100w-3-puertos,${POWER_BANK}`,
    });

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Solo puedes comparar productos de una misma categoría",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver cargadores" }),
    ).toHaveAttribute("href", "/categorias/cargadores");
    expect(
      screen.getByRole("link", { name: "Ver power banks" }),
    ).toHaveAttribute("href", "/categorias/power-banks");
  });

  it("invites to pick products when there are none, with the categories", async () => {
    await renderPage({});

    expect(
      screen.getByRole("heading", { level: 2, name: "Elige qué comparar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Explora por categoría" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations, comparing and explaining", async () => {
    const { container, unmount } = await renderPage({ productos: CHARGERS });
    await expectNoAxeViolations(container);
    unmount();

    const problem = await renderPage({ productos: `x,${POWER_BANK}` });
    await expectNoAxeViolations(problem.container);
  });
});
