import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrderTrackingPage, {
  metadata,
} from "@/app/(transactional)/pedidos/seguimiento/page";

vi.mock("@/modules/orders/ui/order-tracking.container", () => ({
  OrderTrackingContainer: ({ numero }: { numero?: string }) => (
    <p>Seguimiento {numero ?? "sin número"}</p>
  ),
}));

function page(searchParams: Record<string, string | string[]>) {
  return OrderTrackingPage({
    searchParams: Promise.resolve(searchParams),
  } as Parameters<typeof OrderTrackingPage>[0]);
}

describe("/pedidos/seguimiento", () => {
  it("passes ?numero= to the tracking container", async () => {
    render(await page({ numero: "MG-2026-004521" }));
    expect(screen.getByText("Seguimiento MG-2026-004521")).toBeInTheDocument();
  });

  it("ignores a missing or repeated ?numero=", async () => {
    const { unmount } = render(await page({}));
    expect(screen.getByText("Seguimiento sin número")).toBeInTheDocument();
    unmount();

    render(await page({ numero: ["MG-2026-000001", "MG-2026-000002"] }));
    expect(screen.getByText("Seguimiento sin número")).toBeInTheDocument();
  });

  it("has its own title and stays out of search engines", () => {
    expect(metadata).toEqual({
      title: "Seguimiento de pedido",
      robots: { index: false },
    });
  });
});
