import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { ProductPageContainer } from "./product-page.container";

vi.mock("server-only", () => ({}));

// The container reads the default data source (DATA_SOURCE=mock).
const PRIME_100W = "anker-prime-charger-100w-3-puertos";
const NANO_45W = "anker-nano-charger-45w-smart-display";
const MACBOOK = "macbook-air-13-m5";

async function renderPage(slug: string, searchParams = {}) {
  return render(await ProductPageContainer({ slug, searchParams }));
}

describe("ProductPageContainer", () => {
  it("names the page with the product and links the brand and the category", async () => {
    await renderPage(PRIME_100W);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Prime Charger 100W, 3 puertos",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Anker: ver todos sus productos" }),
    ).toHaveAttribute("href", "/marcas/anker");
    expect(screen.getByRole("link", { name: "Cargadores" })).toHaveAttribute(
      "href",
      "/categorias/cargadores",
    );
    expect(screen.getByText("Modelo A2688")).toBeInTheDocument();
  });

  it("sells an in-stock product: price, LED, quantity up to 5 and 'Agregar al carrito'", async () => {
    const { container } = await renderPage(PRIME_100W);

    expect(container).toHaveTextContent("S/ 189.90");
    expect(screen.getAllByText("En stock").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("spinbutton", { name: "Cantidad" }),
    ).toHaveAttribute("aria-valuemax", "5");
    expect(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    ).toBeInTheDocument();
  });

  it("shows the requested variant and explains the backorder", async () => {
    await renderPage(NANO_45W, { variante: "ank-a121d-blk" });

    const color = screen.getByRole("group", { name: "Color" });
    expect(color).toHaveTextContent("Color: Negro");
    expect(within(color).getByRole("link", { name: "Negro" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(within(color).getByRole("link", { name: "Blanco" })).toHaveAttribute(
      "href",
      `/productos/${NANO_45W}`,
    );
    expect(screen.getByText("SKU ANK-A121D-BLK")).toBeInTheDocument();
    expect(
      screen.getByText(/lo pedimos para ti y llega en 15–20 días/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: "Cantidad" }),
    ).toHaveAttribute("aria-valuemax", "2");
  });

  it("offers 'Avísame' for the Apple line and explains configurations that do not exist", async () => {
    await renderPage(MACBOOK);

    expect(
      screen.getByRole("button", { name: "Avísame cuando llegue" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agregar al carrito" }),
    ).toBeNull();
    expect(
      screen.getByRole("group", { name: "Memoria unificada" }),
    ).toHaveTextContent(/24 GB: No disponible con chip M5/);
  });

  it("lists the specs and shows the expert review when there is one", async () => {
    await renderPage(PRIME_100W);

    const specs = screen.getByRole("region", { name: "Especificaciones" });
    expect(within(specs).getByText("Potencia máxima")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Nuestra opinión" }),
    ).toBeInTheDocument();
  });

  it("shows no review section for a product without a review", async () => {
    await renderPage(NANO_45W);

    expect(
      screen.queryByRole("region", { name: "Nuestra opinión" }),
    ).toBeNull();
  });

  it("suggests up to 4 other products of the category", async () => {
    await renderPage(PRIME_100W);

    const related = screen.getByRole("region", {
      name: "También te puede interesar",
    });
    const names = within(related)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(names.length).toBeGreaterThan(0);
    expect(names.length).toBeLessThanOrEqual(4);
    expect(names).not.toContain("Prime Charger 100W, 3 puertos");
  });

  it("offers to compare the product", async () => {
    await renderPage(PRIME_100W);

    expect(screen.getByRole("button", { name: "Comparar" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows the favorites control of the route next to 'Comparar'", async () => {
    render(
      await ProductPageContainer({
        slug: PRIME_100W,
        searchParams: {},
        favorite: (
          <button type="submit" aria-pressed="false">
            Guardar en favoritos
          </button>
        ),
      }),
    );

    const favorite = screen.getByRole("button", {
      name: "Guardar en favoritos",
    });
    const compare = screen.getByRole("button", { name: "Comparar" });
    // Both in the options column, the favorite right after "Comparar".
    expect(
      compare.compareDocumentPosition(favorite) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("describes the product and the selected offer as schema.org data", async () => {
    const { container } = await renderPage(NANO_45W, {
      variante: "ank-a121d-blk",
    });

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(JSON.parse(script?.textContent ?? "")).toMatchObject({
      "@type": "Product",
      name: "Nano Charger 45W Smart Display",
      sku: "ANK-A121D-BLK",
      brand: { "@type": "Brand", name: "Anker" },
      offers: {
        price: "248.90",
        priceCurrency: "PEN",
        availability: "https://schema.org/BackOrder",
      },
    });
  });

  it("answers 404 for an unknown product", async () => {
    await expect(
      ProductPageContainer({ slug: "no-existe", searchParams: {} }),
    ).rejects.toHaveProperty("digest", expect.stringContaining("404"));
  });

  it.each([PRIME_100W, NANO_45W, MACBOOK])(
    "has no axe violations (%s)",
    async (slug) => {
      const { container } = await renderPage(slug);

      await expectNoAxeViolations(container);
    },
  );
});
