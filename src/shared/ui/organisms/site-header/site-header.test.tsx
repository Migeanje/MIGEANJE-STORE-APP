import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { SiteHeader } from "./site-header";

const navigation = vi.hoisted(() => ({
  pathname: "/",
  search: "",
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

const CATEGORIES = [
  { slug: "cargadores", name: "Cargadores" },
  { slug: "cables", name: "Cables" },
  { slug: "audio", name: "Audio" },
];

function getMenuButton() {
  return screen.getByRole("button", { name: "Abrir menú" });
}

/** Stops jsdom from attempting a real navigation after a link click. */
function preventNextNavigation() {
  document.addEventListener("click", (event) => event.preventDefault(), {
    once: true,
  });
}

describe("SiteHeader", () => {
  beforeEach(() => {
    navigation.pathname = "/";
    navigation.search = "";
    navigation.push.mockClear();
  });

  it("renders a banner with the wordmark linking home", () => {
    render(<SiteHeader categories={CATEGORIES} />);

    const banner = screen.getByRole("banner");
    expect(
      within(banner).getByRole("link", { name: "Migeanje Store" }),
    ).toHaveAttribute("href", "/");
  });

  it("stays off paper (printed pages such as the complaint constancia)", () => {
    render(<SiteHeader categories={CATEGORIES} />);

    expect(screen.getByRole("banner")).toHaveClass("print:hidden");
  });

  it("lists the categories in a labelled navigation", () => {
    render(<SiteHeader categories={CATEGORIES} />);

    const nav = screen.getByRole("navigation", { name: "Categorías" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Cargadores",
      "Cables",
      "Audio",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/categorias/cargadores",
      "/categorias/cables",
      "/categorias/audio",
    ]);
  });

  it("marks the current category with aria-current", () => {
    navigation.pathname = "/categorias/cables";
    render(<SiteHeader categories={CATEGORIES} />);

    const nav = screen.getByRole("navigation", { name: "Categorías" });
    expect(within(nav).getByRole("link", { name: "Cables" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav).getByRole("link", { name: "Cargadores" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("link", { name: "Migeanje Store" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("marks the wordmark as the current page on the home page", () => {
    render(<SiteHeader categories={CATEGORIES} />);

    expect(
      screen.getByRole("link", { name: "Migeanje Store" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it.each([
    [0, "Carrito, 0 productos"],
    [1, "Carrito, 1 producto"],
    [3, "Carrito, 3 productos"],
  ])("names the cart link with its count (%i)", (cartCount, name) => {
    render(<SiteHeader categories={CATEGORIES} cartCount={cartCount} />);

    expect(screen.getByRole("link", { name })).toHaveAttribute(
      "href",
      "/carrito",
    );
  });

  it("shows a decorative count badge only when the cart has items", () => {
    const { rerender } = render(<SiteHeader categories={CATEGORIES} />);
    expect(screen.queryByTestId("cart-count")).toBeNull();

    rerender(<SiteHeader categories={CATEGORIES} cartCount={3} />);
    expect(screen.getByTestId("cart-count")).toHaveTextContent("3");
    expect(
      screen.getByTestId("cart-count").closest('[aria-hidden="true"]'),
    ).not.toBeNull();

    rerender(<SiteHeader categories={CATEGORIES} cartCount={120} />);
    expect(screen.getByTestId("cart-count")).toHaveTextContent("99+");
    expect(
      screen.getByRole("link", { name: "Carrito, 120 productos" }),
    ).toBeInTheDocument();
  });

  it.each([-1, 1.5, Number.NaN])(
    "throws a RangeError for a cart count of %d",
    (cartCount) => {
      expect(() =>
        render(<SiteHeader categories={CATEGORIES} cartCount={cartCount} />),
      ).toThrow(RangeError);
    },
  );

  it("renders the cart slot instead of the default cart link", () => {
    render(
      <SiteHeader
        categories={CATEGORIES}
        cart={<button type="button">Carrito, 2 productos</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Carrito, 2 productos" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Carrito/ })).toBeNull();
  });

  it("links to the account page", () => {
    render(<SiteHeader categories={CATEGORIES} />);

    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute(
      "href",
      "/cuenta",
    );
  });

  it("searches with a native GET form to /buscar, enhanced with client navigation", async () => {
    const user = userEvent.setup();
    render(<SiteHeader categories={CATEGORIES} />);

    const form = screen.getByRole("search");
    // Without JavaScript the form still submits to /buscar?q=...
    expect(form).toHaveAttribute("action", "/buscar");
    expect(form).toHaveAttribute("method", "get");

    await user.type(within(form).getByRole("searchbox"), "cargador GaN{Enter}");

    expect(navigation.push).toHaveBeenCalledWith("/buscar?q=cargador+GaN");
  });

  it("shows the current query on the search page", () => {
    navigation.pathname = "/buscar";
    navigation.search = "q=power+bank";
    render(<SiteHeader categories={CATEGORIES} />);

    expect(screen.getByRole("searchbox")).toHaveValue("power bank");
  });

  it("keeps the search empty on other pages", () => {
    navigation.pathname = "/categorias/cables";
    navigation.search = "q=cable";
    render(<SiteHeader categories={CATEGORIES} />);

    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("follows ?q= when the URL changes, and keeps your typing until then", async () => {
    const user = userEvent.setup();
    navigation.pathname = "/buscar";
    navigation.search = "q=cable";
    const { rerender } = render(<SiteHeader categories={CATEGORIES} />);
    const searchbox = screen.getByRole("searchbox");

    await user.type(searchbox, " usb");
    rerender(<SiteHeader categories={CATEGORIES} />);
    expect(searchbox).toHaveValue("cable usb");

    navigation.search = "q=cargador";
    rerender(<SiteHeader categories={CATEGORIES} />);
    expect(screen.getByRole("searchbox")).toHaveValue("cargador");

    navigation.pathname = "/";
    navigation.search = "";
    rerender(<SiteHeader categories={CATEGORIES} />);
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("shows the current query in the mobile menu too", async () => {
    const user = userEvent.setup();
    navigation.pathname = "/buscar";
    navigation.search = "q=hub";
    render(<SiteHeader categories={CATEGORIES} />);

    await user.click(getMenuButton());

    expect(
      within(screen.getByRole("dialog")).getByRole("searchbox"),
    ).toHaveValue("hub");
  });

  it("opens the mobile menu from the keyboard, and Escape closes it and returns focus", async () => {
    const user = userEvent.setup();
    render(<SiteHeader categories={CATEGORIES} />);
    const menuButton = getMenuButton();
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    menuButton.focus();
    await user.keyboard("{Enter}");

    const menu = screen.getByRole("dialog", { name: "Menú" });
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(
      within(menu).getByRole("navigation", { name: "Categorías" }),
    ).toBeInTheDocument();
    expect(within(menu).getByRole("search")).toBeInTheDocument();
    expect(menu).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(menuButton).toHaveFocus();
  });

  it("marks the current category in the mobile menu too", async () => {
    const user = userEvent.setup();
    navigation.pathname = "/categorias/audio";
    render(<SiteHeader categories={CATEGORIES} />);

    await user.click(getMenuButton());

    const menu = screen.getByRole("dialog", { name: "Menú" });
    expect(within(menu).getByRole("link", { name: "Audio" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("closes the mobile menu when a link is chosen", async () => {
    const user = userEvent.setup();
    render(<SiteHeader categories={CATEGORIES} />);
    await user.click(getMenuButton());

    preventNextNavigation();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("link", { name: "Cables" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes the mobile menu and navigates when searching from it", async () => {
    const user = userEvent.setup();
    render(<SiteHeader categories={CATEGORIES} />);
    await user.click(getMenuButton());

    await user.type(
      within(screen.getByRole("dialog")).getByRole("searchbox"),
      "power bank{Enter}",
    );

    expect(navigation.push).toHaveBeenCalledWith("/buscar?q=power+bank");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no axe violations with the menu closed and open", async () => {
    const user = userEvent.setup();
    navigation.pathname = "/categorias/cables";
    render(<SiteHeader categories={CATEGORIES} cartCount={2} />);

    await expectNoAxeViolations(document.body);

    await user.click(getMenuButton());
    await expectNoAxeViolations(document.body);
  });
});
