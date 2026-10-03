import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CategoryPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/(discovery)/categorias/[slug]/page";

vi.mock("@/modules/catalog/ui/category-page.container", () => ({
  CategoryPageContainer: ({
    slug,
    searchParams,
  }: {
    slug: string;
    searchParams: Record<string, unknown>;
  }) => (
    <p>
      Categoría {slug} con {JSON.stringify(searchParams)}
    </p>
  ),
}));

vi.mock("@/modules/catalog/ui/catalog-routes", () => ({
  categoryStaticParams: async () => [{ slug: "cables" }],
  categoryMetadata: async (slug: string) => ({ title: `Título ${slug}` }),
}));

type Props = Parameters<typeof CategoryPage>[0];

function props(slug: string, query: Record<string, string>): Props {
  return {
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve(query),
  } as Props;
}

describe("CategoryPage", () => {
  it("renders the category container with the slug and the URL query", async () => {
    render(await CategoryPage(props("cables", { marca: "anker" })));

    expect(
      screen.getByText('Categoría cables con {"marca":"anker"}'),
    ).toBeInTheDocument();
  });

  it("prerenders every category", async () => {
    expect(await generateStaticParams()).toEqual([{ slug: "cables" }]);
  });

  it("delegates its metadata to the catalog", async () => {
    expect(await generateMetadata(props("cables", {}))).toEqual({
      title: "Título cables",
    });
  });
});
