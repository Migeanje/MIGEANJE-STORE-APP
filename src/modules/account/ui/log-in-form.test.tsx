import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, type Mock, vi } from "vitest";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import { expectNoAxeViolations } from "@/test/a11y";
import type { LogInFormState } from "./account-forms";
import { type LogInAction, LogInForm } from "./log-in-form";

function renderForm({
  action = vi.fn<LogInAction>(async (state) => state),
  initialState = initialFormState(),
  returnTo,
}: {
  action?: Mock<LogInAction>;
  initialState?: LogInFormState;
  returnTo?: string;
} = {}) {
  const user = userEvent.setup();
  const view = render(
    <LogInForm
      action={action}
      initialState={initialState}
      returnTo={returnTo}
    />,
  );
  return { user, action, ...view };
}

const emailField = () =>
  screen.getByRole("textbox", { name: /Correo electrónico/ });
const passwordField = () => screen.getByLabelText(/Contraseña/);

describe("LogInForm", () => {
  it("asks for the email and the password with password-manager hints", async () => {
    const { container } = renderForm();

    expect(emailField()).toHaveAttribute("type", "email");
    expect(emailField()).toHaveAttribute("autocomplete", "username");
    expect(passwordField()).toHaveAttribute("type", "password");
    expect(passwordField()).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("button", { name: "Ingresar" })).toHaveAttribute(
      "type",
      "submit",
    );
    await expectNoAxeViolations(container);
  });

  it("checks the fields on the client and focuses the summary", async () => {
    const { user, action } = renderForm();

    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary).toHaveTextContent("Escribe tu correo electrónico.");
    expect(summary).toHaveTextContent("Escribe tu contraseña.");
    expect(action).not.toHaveBeenCalled();
  });

  it("posts the fields and the return address", async () => {
    const { user, action } = renderForm({ returnTo: "/cuenta/pedidos" });

    await user.type(emailField(), "demo@migeanje.pe");
    await user.type(passwordField(), "Demo-2026!");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = action.mock.calls[0]?.[1] as FormData;
    expect(Object.fromEntries(data)).toEqual({
      email: "demo@migeanje.pe",
      password: "Demo-2026!",
      volver: "/cuenta/pedidos",
    });
  });

  it("shows the server's neutral answer, keeping the email but never the password", async () => {
    const { container } = renderForm({
      initialState: {
        values: { email: "demo@migeanje.pe" },
        errors: {},
        formError: {
          title: "No pudimos ingresar",
          message: "Correo o contraseña incorrectos.",
        },
        attempt: 1,
      },
    });

    expect(
      screen.getByRole("region", { name: "No pudimos ingresar" }),
    ).toHaveTextContent("Correo o contraseña incorrectos.");
    expect(emailField()).toHaveValue("demo@migeanje.pe");
    expect(passwordField()).toHaveValue("");
    await expectNoAxeViolations(container);
  });
});
