import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { OrderTrackingForm, type TrackAction } from "./order-tracking-form";
import { type TrackingFormState, trackingInitialState } from "./tracking-form";

function renderForm({
  action = vi.fn<TrackAction>(async (state) => state),
  initialState = trackingInitialState(undefined),
}: {
  action?: TrackAction;
  initialState?: TrackingFormState;
} = {}) {
  const user = userEvent.setup();
  const view = render(
    <OrderTrackingForm action={action} initialState={initialState} />,
  );
  return { user, action, ...view };
}

const numberField = () =>
  screen.getByRole("textbox", { name: /Número de pedido/ });
const emailField = () =>
  screen.getByRole("textbox", { name: /Correo electrónico/ });

describe("OrderTrackingForm", () => {
  it("asks for the order number (in mono) and the email", () => {
    renderForm();

    expect(numberField()).toHaveClass("font-mono");
    expect(numberField()).toBeRequired();
    expect(numberField()).toHaveAccessibleDescription(
      "Está en tu correo de confirmación, por ejemplo MG-2026-004521.",
    );
    expect(emailField()).toHaveAttribute("type", "email");
    expect(emailField()).toHaveAttribute("autocomplete", "email");
    expect(
      screen.getByRole("button", { name: "Consultar pedido" }),
    ).toHaveAttribute("type", "submit");
  });

  it("prefills the number from the link, never the email", () => {
    renderForm({ initialState: trackingInitialState("mg-2026-004521") });

    expect(numberField()).toHaveValue("MG-2026-004521");
    expect(emailField()).toHaveValue("");
  });

  it("checks the fields on the client before posting", async () => {
    const { user, action } = renderForm();

    await user.type(numberField(), "MG-2026-45");
    await user.click(screen.getByRole("button", { name: "Consultar pedido" }));

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(
      within(summary).getByRole("link", {
        name: "Revisa el número de pedido: tiene la forma MG-2026-004521.",
      }),
    ).toHaveAttribute("href", "#seguimiento-numero");
    expect(
      within(summary).getByRole("link", {
        name: "Escribe tu correo electrónico.",
      }),
    ).toHaveAttribute("href", "#seguimiento-correo");
    expect(action).not.toHaveBeenCalled();
  });

  it("posts what was typed (lowercase and spaces are fine)", async () => {
    const { user, action } = renderForm();

    await user.type(numberField(), "mg 2026 004521");
    await user.type(emailField(), "ana@correo.pe");
    await user.click(screen.getByRole("button", { name: "Consultar pedido" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = vi.mocked(action).mock.calls[0]?.[1] as FormData;
    expect(data.get("number")).toBe("mg 2026 004521");
    expect(data.get("email")).toBe("ana@correo.pe");
  });

  it("shows the server's neutral answer and keeps what was typed", async () => {
    const answer: TrackingFormState = {
      values: { number: "MG-2026-004521", email: "otra@correo.pe" },
      errors: {},
      formError: {
        title: "Revisa estos datos",
        message:
          "No encontramos un pedido con esos datos. Revisa el número y el correo con el que compraste.",
      },
      attempt: 1,
    };
    const { user } = renderForm({
      action: vi.fn<TrackAction>(async () => answer),
    });

    await user.type(numberField(), "MG-2026-004521");
    await user.type(emailField(), "otra@correo.pe");
    await user.click(screen.getByRole("button", { name: "Consultar pedido" }));

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    expect(summary).toHaveTextContent(
      "No encontramos un pedido con esos datos",
    );
    await waitFor(() => expect(summary).toHaveFocus());
    expect(numberField()).toHaveValue("MG-2026-004521");
  });

  it("renders a server answer without JavaScript (no-JS re-render)", () => {
    renderForm({
      initialState: {
        values: { number: "MG-2026-004521", email: "otra@correo.pe" },
        errors: {},
        formError: {
          title: "Demasiados intentos",
          message: "Espera unos minutos y vuelve a intentarlo.",
        },
        attempt: 1,
      },
    });

    expect(
      screen.getByRole("region", { name: "Demasiados intentos" }),
    ).toBeInTheDocument();
    expect(emailField()).toHaveValue("otra@correo.pe");
  });

  it("has no axe violations, empty and with errors", async () => {
    const { container, user } = renderForm();
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: "Consultar pedido" }));
    await screen.findByRole("region", { name: "Revisa estos datos" });
    await expectNoAxeViolations(container);
  });
});
