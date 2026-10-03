import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockCatalog } from "@/modules/catalog/infrastructure/catalog.mock";
import { expectNoAxeViolations } from "@/test/a11y";
import { CategoryShortcutsContainer } from "./category-shortcuts.container";
import { SiteFooterContainer } from "./site-footer.container";
import { SiteHeaderContainer } from "./site-header.container";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// The containers read the default data source (DATA_SOURCE=mock).
const CATEGORY_LINKS = mockCatalog.categories.map(({ slug, name }) => [
  name,
  `/categorias/${slug}`,
]);

function linksIn(container: HTMLElement): (string | null)[][] {
  return within(container)
    .getAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);
}

describe("SiteHeaderContainer", () => {
  it("renders the header with the catalog categories and an empty cart", async () => {
    render(await SiteHeaderContainer());

    expect(
      linksIn(screen.getByRole("navigation", { name: "Categorías" })),
    ).toEqual(CATEGORY_LINKS);
    expect(
      screen.getByRole("link", { name: "Carrito, 0 productos" }),
    ).toBeInTheDocument();
  });

  it("shows the cart control it is given", async () => {
    render(
      await SiteHeaderContainer({
        cart: <button type="button">Carrito, 2 productos</button>,
      }),
    );

    expect(
      screen.getByRole("button", { name: "Carrito, 2 productos" }),
    ).toBeInTheDocument();
  });
});

describe("SiteFooterContainer", () => {
  it("renders the footer with the catalog categories under Tienda", async () => {
    render(await SiteFooterContainer());

    expect(linksIn(screen.getByRole("navigation", { name: "Tienda" }))).toEqual(
      CATEGORY_LINKS,
    );
  });
});

describe("CategoryShortcutsContainer", () => {
  it("links every catalog category under a labelled navigation", async () => {
    const { container } = render(await CategoryShortcutsContainer());

    const nav = screen.getByRole("navigation", {
      name: "Explora por categoría",
    });
    expect(
      within(nav).getByRole("heading", {
        level: 2,
        name: "Explora por categoría",
      }),
    ).toBeInTheDocument();
    expect(linksIn(nav)).toEqual(CATEGORY_LINKS);
    await expectNoAxeViolations(container);
  });

  // E.g. the empty cart page under the open cart drawer (which hides the page).
  it("takes another heading id, so two never share an id", async () => {
    render(
      <>
        {await CategoryShortcutsContainer()}
        {await CategoryShortcutsContainer({ headingId: "carrito-categorias" })}
      </>,
    );

    const navs = screen.getAllByRole("navigation", {
      name: "Explora por categoría",
    });
    expect(navs.map((nav) => nav.getAttribute("aria-labelledby"))).toEqual([
      "category-shortcuts",
      "carrito-categorias",
    ]);
  });
});
