import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockCatalog } from "@/modules/catalog/infrastructure/catalog.mock";
import { expectNoAxeViolations } from "@/test/a11y";
import { CategoryPageContainer } from "./category-page.container";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: vi.fn() }),
}));

// The container reads the default data source (DATA_SOURCE=mock).
const chargers = mockCatalog.products.filter(
  (product) => product.category.slug === "cargadores",
);

function cards(): HTMLElement[] {
  return screen.queryAllByRole("article");
}

describe("CategoryPageContainer", () => {
  it("titles the page with the category and its product count", async () => {
    render(
      await CategoryPageContainer({ slug: "cargadores", searchParams: {} }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Cargadores" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      `${chargers.length} productos`,
    );
    expect(cards()).toHaveLength(chargers.length);
  });

  it("applies the URL filters and shows them as removable chips", async () => {
    render(
      await CategoryPageContainer({
        slug: "cargadores",
        searchParams: { potencia: "100-", utm_source: "x" },
      }),
    );

    const powerful = chargers.filter(
      (product) => (product.specs.maxPower as number) >= 100,
    );
    expect(cards()).toHaveLength(powerful.length);
    expect(screen.getByRole("status")).toHaveTextContent(
      `${powerful.length} de ${chargers.length} productos`,
    );
    const chips = screen.getByRole("list", { name: "Filtros activos" });
    expect(
      within(chips).getByRole("link", {
        name: "Quitar filtro: Potencia máxima: desde 100 W",
      }),
    ).toHaveAttribute("href", "/categorias/cargadores");
  });

  it("offers the filters as a native form to the category page", async () => {
    render(
      await CategoryPageContainer({ slug: "cargadores", searchParams: {} }),
    );

    const form = screen.getByRole("form", { name: "Filtros" });
    expect(form).toHaveAttribute("action", "/categorias/cargadores");
    expect(
      within(form).getByRole("group", { name: "Potencia máxima (W)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Ordenar por" })).toHaveValue(
      "relevancia",
    );
  });

  it("turns no results into a way back", async () => {
    render(
      await CategoryPageContainer({
        slug: "cargadores",
        searchParams: { potencia: "500-", orden: "precio-desc" },
      }),
    );

    expect(cards()).toHaveLength(0);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "No hay productos con estos filtros",
      }),
    ).toBeInTheDocument();
    const clear = screen.getAllByRole("link", { name: "Quitar filtros" });
    for (const link of clear) {
      expect(link).toHaveAttribute(
        "href",
        "/categorias/cargadores?orden=precio-desc",
      );
    }
  });

  it("answers 404 for an unknown category", async () => {
    await expect(
      CategoryPageContainer({ slug: "drones", searchParams: {} }),
    ).rejects.toHaveProperty("digest", expect.stringContaining("404"));
  });

  it("has no axe violations, with and without filters", async () => {
    const { container, unmount } = render(
      await CategoryPageContainer({ slug: "cargadores", searchParams: {} }),
    );
    await expectNoAxeViolations(container);
    unmount();

    const filtered = render(
      await CategoryPageContainer({
        slug: "cargadores",
        searchParams: { marca: "anker", pantalla: "si" },
      }),
    );
    await expectNoAxeViolations(filtered.container);
  });
});
