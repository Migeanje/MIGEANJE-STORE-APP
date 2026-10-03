import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { describeTrustPage } from "../_legal/trust-page-checks";
import WarrantyPage, { generateMetadata } from "./page";

describeTrustPage({
  path: "/garantias",
  Page: WarrantyPage,
  metadata: generateMetadata,
  title: "Garantías",
  legal: true,
});

describe("/garantias", () => {
  it("explains the three legal warranties and the manufacturer's", () => {
    render(<WarrantyPage />);
    const legal = screen.getByRole("region", { name: "Tu garantía legal" });
    for (const kind of ["Legal:", "Explícita:", "Implícita:"]) {
      expect(within(legal).getByText(kind)).toBeInTheDocument();
    }
    const maker = screen.getByRole("region", {
      name: "Garantía del fabricante",
    });
    expect(maker).toHaveTextContent("según el fabricante");
    expect(maker).toHaveTextContent("garantía limitada de un año");
  });
});
