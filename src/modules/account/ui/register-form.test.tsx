import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import { expectNoAxeViolations } from "@/test/a11y";
import { type RegisterAction, RegisterForm } from "./register-form";

function renderForm(action = vi.fn<RegisterAction>(async (state) => state)) {
  const user = userEvent.setup();
  const view = render(
    <RegisterForm
      action={action}
      initialState={initialFormState()}
      termsHref="/terminos"
      privacyHref="/privacidad"
    />,
  );
  return { user, action, ...view };
}

describe("RegisterForm", () => {
  it("explains the password rules before typing", async () => {
    const { container } = renderForm();

    const password = screen.getByLabelText(/^Contraseña/);
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password).toHaveAccessibleDescription(
      "Tu contraseña necesita: entre 8 y 128 caracteres, al menos una letra y al menos un número.",
    );
    expect(
      screen.getByRole("textbox", { name: "Celular (opcional)" }),
    ).not.toBeRequired();
    await expectNoAxeViolations(container);
  });

  it("says which rules a weak password breaks, and asks for the consent", async () => {
    const { user, action } = renderForm();

    await user.type(screen.getByRole("textbox", { name: /Nombres/ }), "Luis");
    await user.type(
      screen.getByRole("textbox", { name: /Apellidos/ }),
      "Rojas",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
      "luis@correo.pe",
    );
    await user.type(screen.getByLabelText(/^Contraseña/), "clave");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary).toHaveTextContent(
      "Tu contraseña necesita: entre 8 y 128 caracteres y al menos un número.",
    );
    expect(summary).toHaveTextContent(
      "Acepta los términos y la política de privacidad para crear tu cuenta.",
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("posts a complete form", async () => {
    const { user, action } = renderForm();

    await user.type(screen.getByRole("textbox", { name: /Nombres/ }), "Luis");
    await user.type(
      screen.getByRole("textbox", { name: /Apellidos/ }),
      "Rojas",
    );
    await user.type(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
      "luis@correo.pe",
    );
    await user.type(screen.getByLabelText(/^Contraseña/), "Otra-clave-2");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = action.mock.calls[0]?.[1] as FormData;
    expect(data.get("acceptTerms")).toBe("si");
    expect(data.get("password")).toBe("Otra-clave-2");
  });
});
