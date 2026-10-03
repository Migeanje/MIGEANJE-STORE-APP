import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/ui/atoms/button";
import { expectNoAxeViolations } from "@/test/a11y";
import { PurchasePanel } from "./purchase-panel";

describe("PurchasePanel", () => {
  it("shows the price, the availability and the SKU", () => {
    const { container } = render(
      <PurchasePanel
        price={{ amount: 18990 }}
        availability={{ status: "in_stock", label: "En stock" }}
        sku="ANK-A2688"
      />,
    );

    expect(container).toHaveTextContent("S/ 189.90");
    expect(screen.getByText("En stock")).toBeInTheDocument();
    expect(screen.getByText("SKU ANK-A2688")).toHaveClass("font-mono");
  });

  it("labels the current and the previous price", () => {
    render(
      <PurchasePanel
        price={{ amount: 12990, compareAt: 15990 }}
        availability={{ status: "in_stock", label: "En stock" }}
      />,
    );

    expect(screen.getByText(/Precio actual/)).toBeInTheDocument();
    expect(screen.getByText(/Precio anterior/)).toBeInTheDocument();
  });

  it("explains a backorder and renders the actions", () => {
    render(
      <PurchasePanel
        price={{ amount: 24890 }}
        availability={{
          status: "backorder",
          label: "En importación · llega en 15–20 días",
        }}
        note="En importación: lo pedimos para ti."
      >
        <Button>Agregar al carrito</Button>
      </PurchasePanel>,
    );

    expect(
      screen.getByText("En importación: lo pedimos para ti."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <PurchasePanel
        price={{ amount: 24890, compareAt: 27990 }}
        availability={{
          status: "backorder",
          label: "En importación · llega en 15–20 días",
        }}
        note="En importación: lo pedimos para ti."
        sku="ANK-A121D-BLK"
      >
        <Button>Agregar al carrito</Button>
      </PurchasePanel>,
    );

    await expectNoAxeViolations(container);
  });
});
