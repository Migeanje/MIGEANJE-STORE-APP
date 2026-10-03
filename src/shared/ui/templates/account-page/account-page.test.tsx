import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { AccountPage } from "./account-page";

describe("AccountPage", () => {
  it("shows the title, the account navigation and the content", async () => {
    const { container } = render(
      <AccountPage
        title="Mis pedidos"
        description="Tus compras, de la más reciente a la más antigua."
        nav={
          <nav aria-label="Tu cuenta">
            <a href="/cuenta">Resumen</a>
          </nav>
        }
      >
        <p>Contenido</p>
      </AccountPage>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Mis pedidos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tus compras, de la más reciente a la más antigua."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Tu cuenta" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
    await expectNoAxeViolations(container);
  });

  it("shows a notice (e.g. after saving) as a status message", async () => {
    const { container } = render(
      <AccountPage title="Mis datos" nav={null} notice="Guardamos tus datos.">
        <p>Formulario</p>
      </AccountPage>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Guardamos tus datos.",
    );
    await expectNoAxeViolations(container);
  });
});
