import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ComplaintReceiptPage, {
  metadata,
} from "@/app/(transactional)/libro-de-reclamaciones/constancia/[number]/page";

vi.mock("@/modules/complaints/ui/complaint-receipt.container", () => ({
  ComplaintReceiptContainer: ({ number }: { number: string }) => (
    <p>Constancia {number}</p>
  ),
}));

describe("/libro-de-reclamaciones/constancia/[number]", () => {
  it("passes the sheet number to the receipt container", async () => {
    render(
      await ComplaintReceiptPage({
        params: Promise.resolve({ number: "000000001-2026" }),
      } as Parameters<typeof ComplaintReceiptPage>[0]),
    );

    expect(screen.getByText("Constancia 000000001-2026")).toBeInTheDocument();
  });

  it("stays out of search engines", () => {
    expect(metadata).toEqual({
      title: "Constancia de tu Hoja de Reclamación",
      robots: { index: false },
    });
  });
});
