import { getDefaultNormalizer, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CartLine, type CartLineData } from "./cart-line";

const NBSP = " ";
const EXACT = {
  normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
};

const LINE: CartLineData = {
  href: "/productos/anker-nano-charger-45w-smart-display?variante=ank-a121d-wht",
  name: "Nano Charger 45W Smart Display",
  brand: "Anker",
  variantLabel: "Blanco",
  image: { src: "/mock/products/cargadores.svg", width: 640, height: 640 },
  availability: {
    status: "backorder",
    label: "En importación · llega en 15–20 días",
  },
  unitPrice: 24890,
  lineTotal: 49780,
  quantity: 2,
};

describe("CartLine", () => {
  it("names the product with a link to its page, brand and variant", () => {
    render(<CartLine {...LINE} />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Nano Charger 45W Smart Display",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Nano Charger 45W Smart Display" }),
    ).toHaveAttribute("href", LINE.href);
    expect(screen.getByText("Anker")).toBeInTheDocument();
    expect(screen.getByText("Blanco")).toBeInTheDocument();
  });

  it("shows the availability with its lead time", () => {
    render(<CartLine {...LINE} />);

    expect(
      screen.getByText("En importación · llega en 15–20 días"),
    ).toBeInTheDocument();
  });

  it("shows the line total and the unit price for more than one unit", () => {
    render(<CartLine {...LINE} />);

    expect(screen.getByText(`S/${NBSP}497.80`, EXACT)).toBeInTheDocument();
    expect(screen.getByText("Total:", { exact: false })).toHaveClass("sr-only");
    expect(
      screen.getByText(`S/${NBSP}248.90`, { ...EXACT, exact: false }),
    ).toHaveTextContent("c/upor unidad");
  });

  it("hides the unit price for a single unit", () => {
    render(<CartLine {...LINE} quantity={1} lineTotal={24890} />);

    expect(screen.queryByText("c/u")).toBeNull();
  });

  it("uses a decorative thumbnail", () => {
    const { container } = render(<CartLine {...LINE} />);

    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("renders its controls and the heading level it is given", () => {
    render(
      <CartLine {...LINE} headingLevel={2}>
        <button type="button">Quitar</button>
      </CartLine>,
    );

    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar" })).toBeInTheDocument();
  });

  it("reports a followed product link", async () => {
    const user = userEvent.setup();
    const onLinkClick = vi.fn();
    render(<CartLine {...LINE} onLinkClick={onLinkClick} />);

    const link = screen.getByRole("link");
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);

    expect(onLinkClick).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations with and without a variant", async () => {
    const { container, rerender } = render(<CartLine {...LINE} />);
    await expectNoAxeViolations(container);

    rerender(
      <CartLine
        {...LINE}
        variantLabel={undefined}
        brand={undefined}
        availability={{ status: "in_stock", label: "En stock" }}
      />,
    );
    await expectNoAxeViolations(container);
  });
});
