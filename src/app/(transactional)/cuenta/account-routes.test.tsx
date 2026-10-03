import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddressesPage, {
  metadata as addressesMetadata,
} from "@/app/(transactional)/cuenta/direcciones/page";
import FavoritesPage, {
  metadata as favoritesMetadata,
} from "@/app/(transactional)/cuenta/favoritos/page";
import LogInPage, {
  metadata as logInMetadata,
} from "@/app/(transactional)/cuenta/ingresar/page";
import AccountHomePage, {
  metadata as homeMetadata,
} from "@/app/(transactional)/cuenta/page";
import AccountOrdersPage, {
  metadata as ordersMetadata,
} from "@/app/(transactional)/cuenta/pedidos/page";
import ProfilePage, {
  metadata as profileMetadata,
} from "@/app/(transactional)/cuenta/perfil/page";
import RecoverPasswordPage, {
  metadata as recoverMetadata,
} from "@/app/(transactional)/cuenta/recuperar/page";
import RegisterPage, {
  metadata as registerMetadata,
} from "@/app/(transactional)/cuenta/registro/page";

// Stand-ins for the functions the routes pass to the account pages.
const { findOrders, findCatalogCards } = vi.hoisted(() => ({
  findOrders: async () => [],
  findCatalogCards: async () => [],
}));
vi.mock("@/modules/orders/ui/customer-orders", () => ({
  findCustomerOrders: findOrders,
}));
vi.mock("@/modules/catalog/ui/product-cards", () => ({
  findProductCards: findCatalogCards,
}));

function page(name: string) {
  return ({
    searchParams,
    orders,
    products,
  }: {
    searchParams?: Record<string, unknown>;
    orders?: unknown;
    products?: unknown;
  }) => (
    <p
      data-orders={orders === findOrders ? "pedidos" : undefined}
      data-products={products === findCatalogCards ? "catalogo" : undefined}
    >
      {name} {JSON.stringify(searchParams ?? null)}
    </p>
  );
}

vi.mock("@/modules/account/ui/auth-pages.containers", () => ({
  LogInPageContainer: page("Ingresar"),
  RegisterPageContainer: page("Registro"),
  RecoverPageContainer: page("Recuperar"),
}));
vi.mock("@/modules/account/ui/account-pages.containers", () => ({
  AccountDashboardContainer: page("Resumen"),
  ProfilePageContainer: page("Perfil"),
  AddressesPageContainer: page("Direcciones"),
  AccountOrdersContainer: page("Pedidos"),
  FavoritesPageContainer: page("Favoritos"),
}));

const NOINDEX = { index: false };

function search(params: Record<string, string>) {
  return { searchParams: Promise.resolve(params) } as never;
}

describe("account routes", () => {
  it("are kept out of search engines, each with its own title", () => {
    expect(
      [
        homeMetadata,
        logInMetadata,
        registerMetadata,
        recoverMetadata,
        profileMetadata,
        addressesMetadata,
        ordersMetadata,
        favoritesMetadata,
      ].map(({ title, robots }) => ({ title, robots })),
    ).toEqual([
      { title: "Mi cuenta", robots: NOINDEX },
      { title: "Ingresar", robots: NOINDEX },
      { title: "Crear cuenta", robots: NOINDEX },
      { title: "Recuperar contraseña", robots: NOINDEX },
      { title: "Mis datos", robots: NOINDEX },
      { title: "Direcciones", robots: NOINDEX },
      { title: "Mis pedidos", robots: NOINDEX },
      { title: "Favoritos", robots: NOINDEX },
    ]);
  });

  it("pass the search params to the containers", async () => {
    render(await LogInPage(search({ volver: "/cuenta/pedidos" })));
    render(await RegisterPage(search({})));
    render(await RecoverPasswordPage(search({ aviso: "correo-enviado" })));
    render(await ProfilePage(search({ aviso: "perfil-guardado" })));
    render(await AddressesPage(search({ editar: "x" })));

    expect(
      screen.getByText('Ingresar {"volver":"/cuenta/pedidos"}'),
    ).toBeInTheDocument();
    expect(screen.getByText("Registro {}")).toBeInTheDocument();
    expect(
      screen.getByText('Recuperar {"aviso":"correo-enviado"}'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Perfil {"aviso":"perfil-guardado"}'),
    ).toBeInTheDocument();
    expect(screen.getByText('Direcciones {"editar":"x"}')).toBeInTheDocument();
  });

  it("connect the orders and the catalog to the account pages", async () => {
    render(await AccountHomePage(search({})));
    render(AccountOrdersPage());
    render(await FavoritesPage(search({})));

    expect(screen.getByText(/^Resumen/)).toHaveAttribute(
      "data-orders",
      "pedidos",
    );
    expect(screen.getByText(/^Pedidos/)).toHaveAttribute(
      "data-orders",
      "pedidos",
    );
    expect(screen.getByText(/^Favoritos/)).toHaveAttribute(
      "data-products",
      "catalogo",
    );
  });
});
