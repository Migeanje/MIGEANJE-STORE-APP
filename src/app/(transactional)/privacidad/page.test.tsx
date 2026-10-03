import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { describeTrustPage } from "../_legal/trust-page-checks";
import PrivacyPage, { generateMetadata } from "./page";

describeTrustPage({
  path: "/privacidad",
  Page: PrivacyPage,
  metadata: generateMetadata,
  title: "Política de privacidad",
  legal: true,
});

describe("/privacidad", () => {
  it("lists every cookie and browser storage the store uses today", () => {
    render(<PrivacyPage />);
    const cookies = screen.getByRole("region", {
      name: "Cookies y datos en tu navegador",
    });
    for (const name of [
      "mg_cart",
      "mg_order",
      "mg_complaint",
      "mg_client",
      "migeanje:comparar",
    ]) {
      expect(within(cookies).getByText(name)).toBeInTheDocument();
    }
  });

  it("explains the rights with their deadlines and flags the pending registration", () => {
    render(<PrivacyPage />);
    const rights = screen.getByRole("region", {
      name: "Tus derechos y cómo ejercerlos",
    });
    expect(rights).toHaveTextContent("Acceso: 20 días hábiles.");
    expect(rights).toHaveTextContent(
      "Rectificación, cancelación u oposición: 10 días hábiles.",
    );
    expect(
      within(rights).getByRole("link", { name: /gob\.pe/ }),
    ).toHaveAttribute("rel", "noreferrer");
    expect(
      screen.getByRole("region", {
        name: "Registro de nuestro banco de datos",
      }),
    ).toHaveTextContent("La inscripción está pendiente");
  });
});
