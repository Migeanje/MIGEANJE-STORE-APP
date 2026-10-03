import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchPage, { generateMetadata } from "@/app/(discovery)/buscar/page";

vi.mock("@/modules/catalog/ui/search-page.container", () => ({
  SearchPageContainer: ({
    searchParams,
  }: {
    searchParams: Record<string, unknown>;
  }) => <p>Búsqueda {JSON.stringify(searchParams)}</p>,
}));

vi.mock("@/modules/catalog/ui/catalog-routes", () => ({
  searchMetadata: (searchParams: Record<string, unknown>) => ({
    title: `Título ${JSON.stringify(searchParams)}`,
  }),
}));

type Props = Parameters<typeof SearchPage>[0];

function props(query: Record<string, string>): Props {
  return { searchParams: Promise.resolve(query) } as Props;
}

describe("SearchPage", () => {
  it("renders the search container with the URL query", async () => {
    render(await SearchPage(props({ q: "cargador" })));

    expect(screen.getByText('Búsqueda {"q":"cargador"}')).toBeInTheDocument();
  });

  it("delegates its metadata to the catalog", async () => {
    expect(await generateMetadata(props({ q: "cable" }))).toEqual({
      title: 'Título {"q":"cable"}',
    });
  });
});
