import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BrandPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/(discovery)/marcas/[slug]/page";

vi.mock("@/modules/catalog/ui/brand-page.container", () => ({
  BrandPageContainer: ({ slug }: { slug: string }) => <p>Marca {slug}</p>,
}));

vi.mock("@/modules/catalog/ui/catalog-routes", () => ({
  brandStaticParams: async () => [{ slug: "anker" }],
  brandMetadata: async (slug: string) => ({ title: `Título ${slug}` }),
}));

type Props = Parameters<typeof BrandPage>[0];

function props(slug: string): Props {
  return { params: Promise.resolve({ slug }) } as Props;
}

describe("BrandPage", () => {
  it("renders the brand container with the slug", async () => {
    render(await BrandPage(props("anker")));

    expect(screen.getByText("Marca anker")).toBeInTheDocument();
  });

  it("prerenders every brand", async () => {
    expect(await generateStaticParams()).toEqual([{ slug: "anker" }]);
  });

  it("delegates its metadata to the catalog", async () => {
    expect(await generateMetadata(props("anker"))).toEqual({
      title: "Título anker",
    });
  });
});
