import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { SiteFooter } from "./site-footer";

const CATEGORIES = [
  { slug: "cargadores", name: "Cargadores" },
  { slug: "cables", name: "Cables" },
];

function linksOf(navName: string): [string | null, string | null][] {
  const nav = screen.getByRole("navigation", { name: navName });
  return within(nav)
    .getAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);
}

describe("SiteFooter", () => {
  it("renders the contentinfo landmark", () => {
    render(<SiteFooter categories={CATEGORIES} />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("stays off paper (printed pages such as the complaint constancia)", () => {
    render(<SiteFooter categories={CATEGORIES} />);

    expect(screen.getByRole("contentinfo")).toHaveClass("print:hidden");
  });

  it("lists the categories under Tienda", () => {
    render(<SiteFooter categories={CATEGORIES} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Tienda" }),
    ).toBeInTheDocument();
    expect(linksOf("Tienda")).toEqual([
      ["Cargadores", "/categorias/cargadores"],
      ["Cables", "/categorias/cables"],
    ]);
  });

  it("links the help pages under Ayuda", () => {
    render(<SiteFooter categories={CATEGORIES} />);

    expect(linksOf("Ayuda")).toEqual([
      ["Envíos y devoluciones", "/envios-y-devoluciones"],
      ["Garantías", "/garantias"],
      ["Seguimiento de pedido", "/pedidos/seguimiento"],
    ]);
  });

  it("links the trust and legal pages under Nosotros", () => {
    render(<SiteFooter categories={CATEGORIES} />);

    expect(linksOf("Nosotros")).toEqual([
      ["Cómo elegimos", "/como-elegimos"],
      ["Términos", "/terminos"],
      ["Privacidad", "/privacidad"],
    ]);
  });

  it("shows the Libro de Reclamaciones link with a decorative book icon", () => {
    render(<SiteFooter categories={CATEGORIES} />);

    const link = screen.getByRole("link", { name: "Libro de Reclamaciones" });
    expect(link).toHaveAttribute("href", "/libro-de-reclamaciones");
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the legal and payment lines, with no logo images", () => {
    render(<SiteFooter categories={CATEGORIES} />);

    expect(
      screen.getByText("© 2026 Migeanje Store · RUC por definir"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Paga con tarjeta mediante Culqi"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<SiteFooter categories={CATEGORIES} />);

    await expectNoAxeViolations(container);
  });
});
