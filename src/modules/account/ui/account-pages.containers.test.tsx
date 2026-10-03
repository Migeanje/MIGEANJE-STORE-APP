import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addressId,
  anAccount,
  anAddress,
  anArequipaAddress,
  EMAIL_VERIFIED_AT,
} from "@/modules/account/testing/account-builders";
import {
  aUbigeoTree,
  fakeUbigeo,
} from "@/modules/checkout/testing/checkout-builders";
import { expectNoAxeViolations } from "@/test/a11y";
import type {
  AccountOrderSummary,
  AccountOrdersLookup,
  FavoriteProductsLookup,
} from "./account-extensions";
import {
  AccountDashboardContainer,
  AccountOrdersContainer,
  AddressesPageContainer,
  FavoritesPageContainer,
  ProfilePageContainer,
} from "./account-pages.containers";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
  usePathname: () => "/cuenta",
}));
vi.mock("./actions", () => ({
  logOutAction: vi.fn(),
  updateProfileAction: vi.fn(),
  saveAddressAction: vi.fn(),
  deleteAddressAction: vi.fn(),
  setDefaultAddressAction: vi.fn(),
  removeFavoriteAction: vi.fn(),
}));
vi.mock("@/modules/checkout/infrastructure", () => ({
  getUbigeoDirectory: () => fakeUbigeo(aUbigeoTree()),
}));

const session = vi.hoisted(() => ({
  account: null as ReturnType<typeof anAccount> | null,
}));
vi.mock("./account-session", () => ({
  loadSignedInAccount: async () => session.account,
  requireSignedInAccount: async (returnTo: string) => {
    if (!session.account) {
      throw new Error(`NEXT_REDIRECT:/cuenta/ingresar?volver=${returnTo}`);
    }
    return session.account;
  },
}));

function anOrderSummary(number: string, status: string): AccountOrderSummary {
  return {
    number,
    placedOn: { label: "2 de octubre de 2026", dateTime: "2026-10-02" },
    status,
    total: 20980,
    itemCountLabel: "2 productos",
    trackingHref: `/pedidos/seguimiento?numero=${number}`,
    detailHref: `/checkout/confirmacion/${number}`,
  };
}

const ORDERS = [
  anOrderSummary("MG-2026-275904", "En camino"),
  anOrderSummary("MG-2026-480315", "En importación"),
  anOrderSummary("MG-2026-913628", "Entregado"),
  anOrderSummary("MG-2026-000001", "Entregado"),
];

const findOrders = vi.fn<AccountOrdersLookup>(async () => ORDERS);

const findProducts = vi.fn<FavoriteProductsLookup>(async (slugs) =>
  slugs
    .filter((slug) => slug !== "ya-no-existe")
    .map((slug) => ({
      slug,
      card: {
        href: `/productos/${slug}`,
        image: {
          src: "/mock/products/audio.svg",
          alt: "",
          width: 640,
          height: 640,
        },
        brand: "Soundcore",
        name: `Producto ${slug}`,
        price: { amount: 39990 },
        availability: { status: "in_stock" as const, label: "En stock" },
      },
    })),
);

beforeEach(() => {
  session.account = anAccount({
    firstName: "Lucía",
    emailVerifiedAt: EMAIL_VERIFIED_AT,
    addresses: [anAddress(), anArequipaAddress()],
    defaultAddressId: addressId(1),
    favorites: ["soundcore-liberty-5", "ya-no-existe"],
  });
  findOrders.mockClear();
});

describe("account pages", () => {
  it("send a guest to sign in, back to the page", async () => {
    session.account = null;
    await expect(ProfilePageContainer({ searchParams: {} })).rejects.toThrow(
      "NEXT_REDIRECT:/cuenta/ingresar?volver=/cuenta/perfil",
    );
  });
});

describe("AccountDashboardContainer", () => {
  it("greets the customer with recent orders and quick links", async () => {
    const { container } = render(
      await AccountDashboardContainer({ searchParams: {}, orders: findOrders }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Hola, Lucía" }),
    ).toBeInTheDocument();
    expect(findOrders).toHaveBeenCalledWith("ana@correo.pe");
    const recent = screen.getByRole("region", { name: "Pedidos recientes" });
    // The three newest only.
    expect(within(recent).getAllByRole("article")).toHaveLength(3);
    expect(
      within(recent).getByRole("link", { name: "Ver todos mis pedidos" }),
    ).toHaveAttribute("href", "/cuenta/pedidos");
    expect(
      screen.getByRole("navigation", { name: "Tu cuenta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    ).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("welcomes a new account", async () => {
    render(
      await AccountDashboardContainer({
        searchParams: { aviso: "cuenta-creada" },
        orders: async () => [],
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Creamos tu cuenta.");
    expect(
      screen.getByText("Todavía no tienes pedidos con este correo."),
    ).toBeInTheDocument();
  });

  it("shows no orders until the email is verified, only how to track one", async () => {
    session.account = anAccount({ firstName: "Lucía" });

    const { container } = render(
      await AccountDashboardContainer({ searchParams: {}, orders: findOrders }),
    );

    expect(findOrders).not.toHaveBeenCalled();
    const recent = screen.getByRole("region", { name: "Pedidos recientes" });
    expect(within(recent).queryAllByRole("article")).toHaveLength(0);
    expect(recent).toHaveTextContent(
      "Para ver tus pedidos, primero verifica tu correo. Mientras tanto, puedes seguir tu pedido con su número y tu correo.",
    );
    expect(
      within(recent).getByRole("link", { name: "Seguir un pedido" }),
    ).toHaveAttribute("href", "/pedidos/seguimiento");
    expect(
      within(recent).queryByRole("link", { name: "Ver todos mis pedidos" }),
    ).toBeNull();
    await expectNoAxeViolations(container);
  });
});

describe("ProfilePageContainer", () => {
  it("fills the form with the account's names and mobile", async () => {
    const { container } = render(
      await ProfilePageContainer({
        searchParams: { aviso: "perfil-guardado" },
      }),
    );

    expect(screen.getByRole("textbox", { name: /Nombres/ })).toHaveValue(
      "Lucía",
    );
    expect(screen.getByRole("textbox", { name: /Celular/ })).toHaveValue(
      "987654321",
    );
    expect(screen.getByText("ana@correo.pe")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Guardamos tus datos.",
    );
    expect(screen.getByRole("link", { name: "Mis datos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expectNoAxeViolations(container);
  });
});

describe("AddressesPageContainer", () => {
  it("lists the addresses, marks the main one and offers a new one", async () => {
    const { container } = render(
      await AddressesPageContainer({ searchParams: {} }),
    );

    const list = screen.getByRole("region", { name: "Tus direcciones" });
    const [home, office] = within(list).getAllByRole("article");
    expect(home).toHaveTextContent("Principal");
    expect(home).toHaveTextContent("Miraflores, Lima, Lima");
    expect(office).not.toHaveTextContent("Principal");
    expect(
      within(office as HTMLElement).getByRole("button", {
        name: "Usar como principal: Oficina",
      }),
    ).toBeInTheDocument();
    expect(
      within(home as HTMLElement).getByRole("link", { name: "Editar: Casa" }),
    ).toHaveAttribute("href", `/cuenta/direcciones?editar=${addressId(1)}`);
    expect(
      screen.getByRole("heading", { name: "Agregar una dirección" }),
    ).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("edits the address of ?editar=", async () => {
    render(
      await AddressesPageContainer({
        searchParams: { editar: addressId(2) },
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Editar dirección" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^Dirección/ })).toHaveValue(
      "Calle Mercaderes 210",
    );
    expect(screen.getByRole("combobox", { name: /Distrito/ })).toHaveValue(
      "040103",
    );
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
      "href",
      "/cuenta/direcciones",
    );
  });

  it("says when there are none yet", async () => {
    session.account = anAccount();
    render(await AddressesPageContainer({ searchParams: {} }));
    expect(
      screen.getByText("Todavía no guardas direcciones."),
    ).toBeInTheDocument();
  });
});

describe("AccountOrdersContainer", () => {
  it("lists every order with links to follow it and see its detail", async () => {
    const { container } = render(
      await AccountOrdersContainer({ orders: findOrders }),
    );

    const orders = screen.getAllByRole("article");
    expect(orders).toHaveLength(4);
    const [first] = orders;
    expect(first).toHaveTextContent("MG-2026-275904");
    expect(first).toHaveTextContent("En camino");
    expect(
      within(first as HTMLElement).getByRole("link", {
        name: "Seguir pedido MG-2026-275904",
      }),
    ).toHaveAttribute("href", "/pedidos/seguimiento?numero=MG-2026-275904");
    expect(
      within(first as HTMLElement).getByRole("link", {
        name: "Ver detalle de MG-2026-275904",
      }),
    ).toHaveAttribute("href", "/checkout/confirmacion/MG-2026-275904");
    await expectNoAxeViolations(container);
  });

  it("shows an empty state without orders", async () => {
    render(await AccountOrdersContainer({ orders: async () => [] }));
    expect(
      screen.getByRole("heading", {
        name: "Todavía no tienes pedidos con este correo.",
      }),
    ).toBeInTheDocument();
  });

  it("lists nothing until the email is verified, only how to track an order", async () => {
    session.account = anAccount();

    const { container } = render(
      await AccountOrdersContainer({ orders: findOrders }),
    );

    expect(findOrders).not.toHaveBeenCalled();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Para ver tus pedidos, primero verifica tu correo.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Mientras tanto, puedes seguir tu pedido con su número y tu correo.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Seguir un pedido" }),
    ).toHaveAttribute("href", "/pedidos/seguimiento");
    await expectNoAxeViolations(container);
  });
});

describe("FavoritesPageContainer", () => {
  it("shows the saved products, each with a way to remove it", async () => {
    const { container } = render(
      await FavoritesPageContainer({
        searchParams: { aviso: "favorito-quitado" },
        products: findProducts,
      }),
    );

    expect(findProducts).toHaveBeenCalledWith([
      "soundcore-liberty-5",
      "ya-no-existe",
    ]);
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(1);
    // The button sits outside the card (one link per card).
    expect(within(cards[0] as HTMLElement).queryByRole("button")).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Quitar de favoritos: Producto soundcore-liberty-5",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Algunos productos que guardaste ya no están en el catálogo.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Quitamos el producto de tus favoritos.",
    );
    await expectNoAxeViolations(container);
  });

  it("shows an empty state without favorites", async () => {
    session.account = anAccount();
    render(
      await FavoritesPageContainer({
        searchParams: {},
        products: findProducts,
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Todavía no guardas productos." }),
    ).toBeInTheDocument();
  });
});
