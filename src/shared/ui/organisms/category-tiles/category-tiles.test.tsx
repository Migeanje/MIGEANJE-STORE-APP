import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CategoryTiles } from "./category-tiles";

const CATEGORIES = [
  { href: "/categorias/cargadores", name: "Cargadores", meta: "3 productos" },
  { href: "/categorias/cables", name: "Cables", meta: "2 productos" },
  { href: "/categorias/tablets", name: "Tablets", meta: "1 producto" },
];

describe("CategoryTiles", () => {
  it("links every category, named by its name and product count", () => {
    render(<CategoryTiles categories={CATEGORIES} />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/categorias/cargadores",
      "/categorias/cables",
      "/categorias/tablets",
    ]);
    expect(
      screen.getByRole("link", { name: "Cargadores 3 productos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tablets 1 producto" }),
    ).toBeInTheDocument();
  });

  it("lists the tiles", () => {
    render(<CategoryTiles categories={CATEGORIES} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("keeps its decorative glow and icon out of the accessibility tree", () => {
    const { container } = render(<CategoryTiles categories={CATEGORIES} />);

    for (const decoration of container.querySelectorAll(
      "[data-slot='glow'], svg",
    )) {
      expect(decoration.closest("[aria-hidden='true']")).not.toBeNull();
    }
  });

  it("has no axe violations", async () => {
    const { container } = render(<CategoryTiles categories={CATEGORIES} />);

    await expectNoAxeViolations(container);
  });
});
