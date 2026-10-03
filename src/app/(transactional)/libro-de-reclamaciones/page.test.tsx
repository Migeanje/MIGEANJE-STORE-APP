import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ComplaintBookPage, {
  metadata,
} from "@/app/(transactional)/libro-de-reclamaciones/page";

vi.mock("@/modules/complaints/ui/complaint-book.container", () => ({
  ComplaintBookContainer: ({ pedido }: { pedido?: string }) => (
    <p>Libro {pedido ?? "sin pedido"}</p>
  ),
}));

function page(searchParams: Record<string, string | string[]>) {
  return ComplaintBookPage({
    searchParams: Promise.resolve(searchParams),
  } as Parameters<typeof ComplaintBookPage>[0]);
}

describe("/libro-de-reclamaciones", () => {
  it("passes ?pedido= to the book container", async () => {
    render(await page({ pedido: "MG-2026-004521" }));
    expect(screen.getByText("Libro MG-2026-004521")).toBeInTheDocument();
  });

  it("ignores a missing or repeated ?pedido=", async () => {
    const { unmount } = render(await page({}));
    expect(screen.getByText("Libro sin pedido")).toBeInTheDocument();
    unmount();

    render(await page({ pedido: ["MG-2026-000001", "MG-2026-000002"] }));
    expect(screen.getByText("Libro sin pedido")).toBeInTheDocument();
  });

  it("has its own title and description", () => {
    expect(metadata.title).toBe("Libro de Reclamaciones");
    expect(metadata.description).toMatch(/reclamo o queja/);
  });
});
