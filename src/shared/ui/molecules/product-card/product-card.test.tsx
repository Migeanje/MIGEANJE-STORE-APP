import { getDefaultNormalizer, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import placeholder from "./__fixtures__/placeholder.svg";
import { ProductCard, type ProductCardProps } from "./product-card";

const NBSP = " ";
// The default normalizer turns the NBSP into a plain space; keep it exact.
const EXACT = {
  normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
};

const CHARGER: ProductCardProps = {
  href: "/productos/cargador-gan-65w-3-puertos",
  image: {
    src: placeholder,
    alt: "Cargador de pared blanco con dos puertos USB-C y uno USB-A",
    width: 480,
    height: 480,
  },
  brand: "Anker",
  name: "Cargador GaN 65 W, 3 puertos",
  specs: ["65 W", "GaN", "USB-C"],
  price: { amount: 18900 },
  availability: { status: "in_stock", label: "En stock" },
};

describe("ProductCard", () => {
  it("links the whole card through one link named by the product name", () => {
    render(<ProductCard {...CHARGER} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Cargador GaN 65 W, 3 puertos");
    expect(links[0]).toHaveAttribute(
      "href",
      "/productos/cargador-gan-65w-3-puertos",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("stretches the link over the card (stretched-link pattern)", () => {
    render(<ProductCard {...CHARGER} />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("after:absolute", "after:inset-0");
    expect(link.closest("article")).toHaveClass("relative");
  });

  it("puts the link in an h3 by default", () => {
    render(<ProductCard {...CHARGER} />);

    const heading = screen.getByRole("heading", {
      level: 3,
      name: "Cargador GaN 65 W, 3 puertos",
    });
    expect(heading).toContainElement(screen.getByRole("link"));
    expect(heading).toHaveClass("line-clamp-2", "text-body");
  });

  it("follows headingLevel", () => {
    render(<ProductCard {...CHARGER} headingLevel={2} />);

    expect(
      screen.getByRole("heading", { level: 2, name: CHARGER.name }),
    ).toBeInTheDocument();
  });

  it("shows the image with its alt text", () => {
    render(<ProductCard {...CHARGER} />);

    const image = screen.getByRole("img", { name: CHARGER.image.alt });
    expect(image.tagName).toBe("IMG");
    expect(image).toHaveAttribute("width", "480");
    // Concentric corners: rounded-lg card with p-2 -> rounded-md image well.
    expect(image.closest('[data-slot="media"]')).toHaveClass("rounded-md");
    expect(image.closest("article")).toHaveClass("rounded-lg", "p-2");
  });

  it("puts a decorative amber glow behind the image that lights up on hover and focus", () => {
    const { container } = render(<ProductCard {...CHARGER} />);

    const glow = container.querySelector('[data-slot="glow"]');
    expect(glow).toHaveAttribute("aria-hidden", "true");
    expect(glow).toHaveClass(
      "from-primary/35",
      "group-hover:opacity-100",
      "group-focus-within:opacity-100",
      "duration-(--duration-fast)",
      "ease-out",
    );
  });

  it("shows the focus ring on the card for keyboard focus", () => {
    render(<ProductCard {...CHARGER} />);

    expect(screen.getByRole("article")).toHaveClass(
      "has-focus-visible:outline-2",
      "has-focus-visible:outline-ring",
    );
    expect(screen.getByRole("link")).toHaveClass("focus-visible:outline-none");
  });

  it("shows the brand as text and up to three specs as mono tags", () => {
    render(
      <ProductCard {...CHARGER} specs={["65 W", "GaN", "USB-C", "PD 3.0"]} />,
    );

    expect(screen.getByText("Anker")).toBeInTheDocument();
    const specs = screen.getAllByRole("listitem");
    expect(specs.map((item) => item.textContent)).toEqual([
      "65 W",
      "GaN",
      "USB-C",
    ]);
    expect(screen.getByText("GaN")).toHaveClass("font-mono");
  });

  it("renders no spec list without specs", () => {
    render(<ProductCard {...CHARGER} specs={[]} />);

    expect(screen.queryByRole("list")).toBeNull();
  });

  it("shows the price in soles", () => {
    render(<ProductCard {...CHARGER} />);

    expect(screen.getByText(`S/${NBSP}189.00`, EXACT)).toBeInTheDocument();
  });

  it("shows the previous price when there is a compareAt", () => {
    render(
      <ProductCard {...CHARGER} price={{ amount: 15900, compareAt: 18900 }} />,
    );

    expect(screen.getByText("Precio actual:")).toBeInTheDocument();
    expect(screen.getByText("Precio anterior:").closest("s")?.textContent).toBe(
      `Precio anterior: S/${NBSP}189.00`,
    );
  });

  it.each([
    ["in_stock", "En stock"],
    ["backorder", "En importación · llega en 15–20 días"],
    ["unavailable", "Agotado"],
  ] as const)("shows the %s availability label", (status, label) => {
    render(<ProductCard {...CHARGER} availability={{ status, label }} />);

    const indicator = screen.getByText(label).closest("[data-status]");
    expect(indicator).toHaveAttribute("data-status", status);
  });

  it("forwards native props to the article and merges className", () => {
    render(<ProductCard {...CHARGER} id="p-1" className="max-w-xs" />);

    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("id", "p-1");
    expect(article).toHaveClass("max-w-xs", "bg-card");
  });

  it("has no axe violations in every availability state and with compareAt", async () => {
    const { container } = render(
      <div>
        <ProductCard {...CHARGER} />
        <ProductCard
          {...CHARGER}
          href="/productos/power-bank-20000"
          name="Power bank 20 000 mAh"
          price={{ amount: 24900, compareAt: 27900 }}
          availability={{
            status: "backorder",
            label: "En importación · llega en 15–20 días",
          }}
        />
        <ProductCard
          {...CHARGER}
          href="/productos/cable-usb-c-2m"
          name="Cable USB-C a USB-C, 2 m"
          specs={[]}
          availability={{ status: "unavailable", label: "Agotado" }}
        />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
