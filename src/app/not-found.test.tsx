import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotFound from "@/app/not-found";
import { expectNoAxeViolations } from "@/test/a11y";

// The real container is an async Server Component (tested on its own); jsdom
// renders on the client, so a stand-in marks where it goes.
vi.mock("@/modules/catalog/ui/category-shortcuts.container", () => ({
  CategoryShortcutsContainer: () => (
    <nav aria-label="Explora por categoría">
      <a href="/categorias/cables">Cables</a>
    </nav>
  ),
}));

describe("NotFound", () => {
  it("says the page was not found and links home and to the categories", async () => {
    const { container } = render(<NotFound />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "No encontramos esta página",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("navigation", { name: "Explora por categoría" }),
    ).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
