import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ComparePage, { metadata } from "@/app/(discovery)/comparar/page";
import type { SearchParamsInput } from "@/modules/catalog/ui/catalog-url";

vi.mock("@/modules/catalog/ui/compare-page.container", () => ({
  ComparePageContainer: ({
    searchParams,
  }: {
    searchParams: SearchParamsInput;
  }) => <p>Comparador {JSON.stringify(searchParams)}</p>,
}));

vi.mock("@/modules/catalog/ui/catalog-routes", () => ({
  compareMetadata: { title: "Comparar productos", robots: { index: false } },
}));

type Props = Parameters<typeof ComparePage>[0];

describe("ComparePage", () => {
  it("renders the comparator with the search params", async () => {
    const props = {
      params: Promise.resolve({}),
      searchParams: Promise.resolve({ productos: "a,b" }),
    } as Props;

    render(await ComparePage(props));

    expect(
      screen.getByText('Comparador {"productos":"a,b"}'),
    ).toBeInTheDocument();
  });

  it("is not indexed", () => {
    expect(metadata).toEqual({
      title: "Comparar productos",
      robots: { index: false },
    });
  });
});
