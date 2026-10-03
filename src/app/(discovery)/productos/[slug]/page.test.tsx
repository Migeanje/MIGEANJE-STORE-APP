import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import ProductPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/(discovery)/productos/[slug]/page";
import { addToCartAction } from "@/modules/cart/ui/actions";
import type { AddToCartAction } from "@/modules/catalog/ui/add-to-cart";
import type { SearchParamsInput } from "@/modules/catalog/ui/catalog-url";

vi.mock("@/modules/cart/ui/actions", () => ({
  addToCartAction: async () => ({ ok: true, message: "Agregado" }),
}));

vi.mock("@/modules/account/ui/favorite-toggle.container", () => ({
  FavoriteToggleContainer: ({
    slug,
    returnTo,
  }: {
    slug: string;
    returnTo: string;
  }) => (
    <span>
      Favorito {slug} → {returnTo}
    </span>
  ),
}));

vi.mock("@/modules/catalog/ui/product-page.container", () => ({
  ProductPageContainer: ({
    slug,
    searchParams,
    addToCart,
    favorite,
  }: {
    slug: string;
    searchParams: SearchParamsInput;
    addToCart?: AddToCartAction;
    favorite?: ReactNode;
  }) => (
    <div>
      <p data-cart={addToCart === addToCartAction ? "conectado" : "no"}>
        Producto {slug} {JSON.stringify(searchParams)}
      </p>
      {favorite}
    </div>
  ),
}));

vi.mock("@/modules/catalog/ui/catalog-routes", () => ({
  productStaticParams: async () => [{ slug: "prime-100w" }],
  productMetadata: async (slug: string) => ({ title: `Título ${slug}` }),
}));

type Props = Parameters<typeof ProductPage>[0];

function props(slug: string, search: Record<string, string> = {}): Props {
  return {
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve(search),
  } as Props;
}

describe("ProductPage", () => {
  it("renders the product container with the slug and the search params", async () => {
    render(await ProductPage(props("prime-100w", { variante: "ank-a2688" })));

    expect(
      screen.getByText('Producto prime-100w {"variante":"ank-a2688"}'),
    ).toBeInTheDocument();
  });

  it("passes the account's favorites control, coming back to the product", async () => {
    render(await ProductPage(props("prime-100w", { variante: "ank-a2688" })));

    expect(
      screen.getByText("Favorito prime-100w → /productos/prime-100w"),
    ).toBeInTheDocument();
  });

  it("connects the cart's add-to-cart server action", async () => {
    render(await ProductPage(props("prime-100w")));

    expect(screen.getByText(/Producto prime-100w/)).toHaveAttribute(
      "data-cart",
      "conectado",
    );
  });

  it("prerenders every product", async () => {
    expect(await generateStaticParams()).toEqual([{ slug: "prime-100w" }]);
  });

  it("delegates its metadata to the catalog", async () => {
    expect(await generateMetadata(props("prime-100w"))).toEqual({
      title: "Título prime-100w",
    });
  });
});
