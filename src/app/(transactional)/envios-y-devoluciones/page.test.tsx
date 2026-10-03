import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { describeTrustPage } from "../_legal/trust-page-checks";
import ShippingPage, { generateMetadata } from "./page";

describeTrustPage({
  path: "/envios-y-devoluciones",
  Page: ShippingPage,
  metadata: generateMetadata,
  title: "Envíos y devoluciones",
  legal: true,
});

describe("/envios-y-devoluciones", () => {
  it("lists the rates the checkout charges", () => {
    render(<ShippingPage />);
    const rows = within(
      screen.getByRole("table", { name: /Costo y tiempo del courier/ }),
    ).getAllByRole("row");
    expect(rows.slice(1).map((row) => row.textContent)).toEqual([
      "Lima MetropolitanaS/ 10.0024–48 h (días hábiles)",
      "CallaoS/ 12.0024–48 h (días hábiles)",
      "Resto del PerúS/ 20.003–5 días hábiles",
    ]);
  });

  it("separates what the law requires from the store's own return policy", () => {
    render(<ShippingPage />);
    const returns = screen.getByRole("region", {
      name: "Cambios y devoluciones",
    });
    expect(returns).toHaveTextContent(
      "En el Perú no existe un derecho general a devolver una compra por internet",
    );
    expect(
      within(returns).getByRole("heading", {
        level: 3,
        name: "Nuestra política (propuesta)",
      }),
    ).toBeInTheDocument();
    expect(returns).toHaveTextContent("no te pediremos que venga sellado");
  });
});
