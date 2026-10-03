import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { AccountNav } from "./account-nav";

const ITEMS = [
  { href: "/cuenta", label: "Resumen" },
  { href: "/cuenta/pedidos", label: "Mis pedidos" },
  { href: "/cuenta/favoritos", label: "Favoritos" },
];

describe("AccountNav", () => {
  it("lists the account sections and marks the current one", async () => {
    const { container } = render(
      <AccountNav items={ITEMS} currentHref="/cuenta/pedidos" />,
    );

    const nav = screen.getByRole("navigation", { name: "Tu cuenta" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Resumen",
      "Mis pedidos",
      "Favoritos",
    ]);
    expect(
      within(nav).getByRole("link", { name: "Mis pedidos" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Resumen" }),
    ).not.toHaveAttribute("aria-current");
    await expectNoAxeViolations(container);
  });

  it("renders extra content after the links (e.g. sign out)", () => {
    render(
      <AccountNav
        items={ITEMS}
        currentHref="/cuenta"
        footer={<button type="submit">Cerrar sesión</button>}
      />,
    );

    expect(
      within(screen.getByRole("navigation")).getByRole("button", {
        name: "Cerrar sesión",
      }),
    ).toBeInTheDocument();
  });

  it("throws a RangeError without items", () => {
    expect(() => render(<AccountNav items={[]} currentHref="/" />)).toThrow(
      RangeError,
    );
  });
});
