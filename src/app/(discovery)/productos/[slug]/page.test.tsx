import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/(discovery)/productos/[slug]/page";
import type { SearchParamsInput } from "@/modules/catalog/ui/catalog-url";

vi.mock("@/modules/catalog/ui/product-page.container", () => ({
  ProductPageContainer: ({
    slug,
    searchParams,
  }: {
    slug: string;
    searchParams: SearchParamsInput;
  }) => (
    <p>
      Producto {slug} {JSON.stringify(searchParams)}
    </p>
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

  it("prerenders every product", async () => {
    expect(await generateStaticParams()).toEqual([{ slug: "prime-100w" }]);
  });

  it("delegates its metadata to the catalog", async () => {
    expect(await generateMetadata(props("prime-100w"))).toEqual({
      title: "Título prime-100w",
    });
  });
});
