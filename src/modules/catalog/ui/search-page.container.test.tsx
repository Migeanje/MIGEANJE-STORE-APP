import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { SearchPageContainer } from "./search-page.container";

vi.mock("server-only", () => ({}));
// An embedded async container: tested on its own (site-chrome tests).
vi.mock("./category-shortcuts.container", () => ({
  CategoryShortcutsContainer: () => (
    <nav aria-label="Explora por categoría">
      <a href="/categorias/cargadores">Cargadores</a>
    </nav>
  ),
}));

// The container reads the default data source (DATA_SOURCE=mock).
describe("SearchPageContainer", () => {
  it("echoes the query and lists the results with their count", async () => {
    render(
      await SearchPageContainer({ searchParams: { q: "  power   bank " } }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Resultados para «power bank»",
      }),
    ).toBeInTheDocument();
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent(
      `${cards.length} productos`,
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
      cards.length,
    );
  });

  it("turns no results into suggestions", async () => {
    render(await SearchPageContainer({ searchParams: { q: "zzz" } }));

    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("0 productos");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "No encontramos resultados para «zzz»",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Explora por categoría" }),
    ).toBeInTheDocument();
  });

  it("invites you to search when there is no query", async () => {
    render(await SearchPageContainer({ searchParams: {} }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Buscar productos" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
    expect(
      screen.getByRole("navigation", { name: "Explora por categoría" }),
    ).toBeInTheDocument();
  });

  it("reads only the first q", async () => {
    render(
      await SearchPageContainer({ searchParams: { q: ["cable", "zzz"] } }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Resultados para «cable»",
      }),
    ).toBeInTheDocument();
  });

  it("has no axe violations with and without results", async () => {
    const found = render(
      await SearchPageContainer({ searchParams: { q: "cargador" } }),
    );
    await expectNoAxeViolations(found.container);
    found.unmount();

    const empty = render(
      await SearchPageContainer({ searchParams: { q: "zzz" } }),
    );
    await expectNoAxeViolations(empty.container);
  });
});
