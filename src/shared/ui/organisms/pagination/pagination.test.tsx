import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Pagination, pageItems } from "./pagination";

const hrefForPage = (page: number) =>
  page === 1 ? "/categorias/cables" : `/categorias/cables?pagina=${page}`;

function linkNames(): string[] {
  return within(screen.getByRole("navigation", { name: "Paginación" }))
    .getAllByRole("link")
    .map((link) => link.textContent ?? "");
}

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps the first, last and neighbors of the current page", () => {
    expect(pageItems(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageItems(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(pageItems(10, 10)).toEqual([1, "gap", 9, 10]);
    expect(pageItems(3, 10)).toEqual([1, 2, 3, 4, "gap", 10]);
  });
});

describe("Pagination", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(
      <Pagination page={1} pageCount={1} hrefForPage={hrefForPage} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("links the previous, next and numbered pages", () => {
    render(<Pagination page={2} pageCount={3} hrefForPage={hrefForPage} />);

    expect(linkNames()).toEqual([
      "Página anterior",
      "Página 1",
      "Página 2",
      "Página 3",
      "Página siguiente",
    ]);
    expect(
      screen.getByRole("link", { name: "Página anterior" }),
    ).toHaveAttribute("href", "/categorias/cables");
    expect(
      screen.getByRole("link", { name: "Página siguiente" }),
    ).toHaveAttribute("href", "/categorias/cables?pagina=3");
  });

  it("marks the current page", () => {
    render(<Pagination page={2} pageCount={3} hrefForPage={hrefForPage} />);

    expect(screen.getByRole("link", { name: "Página 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Página 1" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("leaves out previous on the first page and next on the last", () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={3} hrefForPage={hrefForPage} />,
    );
    expect(screen.queryByRole("link", { name: "Página anterior" })).toBeNull();

    rerender(<Pagination page={3} pageCount={3} hrefForPage={hrefForPage} />);
    expect(screen.queryByRole("link", { name: "Página siguiente" })).toBeNull();
  });

  it.each([
    [0, 3],
    [4, 3],
    [1.5, 3],
    [1, 0],
  ])("throws a RangeError for page %d of %d", (page, pageCount) => {
    expect(() =>
      render(
        <Pagination
          page={page}
          pageCount={pageCount}
          hrefForPage={hrefForPage}
        />,
      ),
    ).toThrow(RangeError);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Pagination page={5} pageCount={10} hrefForPage={hrefForPage} />,
    );

    await expectNoAxeViolations(container);
  });
});
