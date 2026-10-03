import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { AuthPage } from "./auth-page";

describe("AuthPage", () => {
  it("shows the title, the form and the links below it", async () => {
    const { container } = render(
      <AuthPage
        title="Ingresa a tu cuenta"
        description="Revisa tus pedidos y guarda tus favoritos."
        footer={<a href="/cuenta/registro">Crea una cuenta</a>}
      >
        <form aria-label="Ingresar" />
      </AuthPage>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Ingresa a tu cuenta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Revisa tus pedidos y guarda tus favoritos."),
    ).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Ingresar" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Crea una cuenta" }),
    ).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it("shows a notice as a status message", () => {
    render(
      <AuthPage title="Recupera tu contraseña" notice="Te enviamos un correo.">
        <p>Formulario</p>
      </AuthPage>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Te enviamos un correo.",
    );
  });
});
