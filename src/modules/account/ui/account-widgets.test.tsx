import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { anAccount } from "@/modules/account/testing/account-builders";
import { AccountHeaderLink } from "./account-header-link";
import { FavoriteToggleContainer } from "./favorite-toggle.container";

vi.mock("server-only", () => ({}));
vi.mock("./actions", () => ({
  toggleFavoriteAction: vi.fn(),
  readAccountNameAction: vi.fn(async () => null),
}));

const navigation = vi.hoisted(() => ({ pathname: "/", search: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

const session = vi.hoisted(() => ({
  account: null as ReturnType<typeof anAccount> | null,
}));
vi.mock("./account-session", () => ({
  loadSignedInAccount: async () => session.account,
}));

beforeEach(() => {
  session.account = null;
  navigation.pathname = "/";
  navigation.search = "";
});

describe("AccountHeaderLink", () => {
  it("links to the account and adds the first name once it is loaded", async () => {
    let resolveName: (name: string | null) => void = () => {};
    const load = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveName = resolve;
        }),
    );
    render(<AccountHeaderLink load={load} />);

    // Static HTML and no JavaScript: the plain link.
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute(
      "href",
      "/cuenta",
    );

    await act(async () => resolveName("Lucía"));
    expect(
      screen.getByRole("link", { name: "Mi cuenta, Lucía" }),
    ).toBeInTheDocument();
  });

  it("stays the plain link for a guest", async () => {
    const load = vi.fn(async () => null);
    render(<AccountHeaderLink load={load} />);
    await waitFor(() => expect(load).toHaveBeenCalled());
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toBeInTheDocument();
  });

  it("asks again after a navigation (signing in or out, a new name)", async () => {
    const load = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValue("Lucía");
    const { rerender } = render(<AccountHeaderLink load={load} />);
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));

    navigation.pathname = "/cuenta";
    navigation.search = "aviso=cuenta-creada";
    rerender(<AccountHeaderLink load={load} />);

    expect(
      await screen.findByRole("link", { name: "Mi cuenta, Lucía" }),
    ).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("FavoriteToggleContainer", () => {
  const props = {
    slug: "soundcore-liberty-5",
    returnTo: "/productos/soundcore-liberty-5",
  };

  it("offers a guest to sign in", async () => {
    render(await FavoriteToggleContainer(props));
    expect(
      screen.getByRole("link", { name: "Guardar en favoritos" }),
    ).toHaveAttribute(
      "href",
      "/cuenta/ingresar?volver=%2Fproductos%2Fsoundcore-liberty-5",
    );
  });

  it("shows whether the product is already a favorite", async () => {
    session.account = anAccount({ favorites: ["soundcore-liberty-5"] });
    render(await FavoriteToggleContainer(props));
    expect(
      screen.getByRole("button", { name: "Guardar en favoritos" }),
    ).toHaveAttribute("aria-pressed", "true");

    session.account = anAccount();
    render(await FavoriteToggleContainer(props));
    expect(
      screen.getAllByRole("button", { name: "Guardar en favoritos" })[1],
    ).toHaveAttribute("aria-pressed", "false");
  });
});
