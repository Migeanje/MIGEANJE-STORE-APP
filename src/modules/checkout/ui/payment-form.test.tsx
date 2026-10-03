import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { initialFormState } from "./checkout-forms";
import type { PayAction } from "./pay-action";
import { PaymentForm } from "./payment-form";

const NBSP = " ";

function renderForm(
  action: PayAction = vi.fn<PayAction>(async (state) => state),
) {
  const user = userEvent.setup();
  const view = render(
    <PaymentForm
      action={action}
      initialState={initialFormState()}
      quote={{ total: 38980, fingerprint: "1a2b3c4d" }}
      termsHref="/terminos"
    />,
  );
  return { user, action, ...view };
}

async function fillCard(
  user: ReturnType<typeof userEvent.setup>,
  number: string,
) {
  await user.type(
    screen.getByRole("textbox", { name: /Número de tarjeta/ }),
    number,
  );
  await user.type(
    screen.getByRole("textbox", { name: /Vencimiento/ }),
    "12/30",
  );
  await user.type(screen.getByRole("textbox", { name: /CVV/ }), "123");
  await user.type(
    screen.getByRole("textbox", { name: /Nombre en la tarjeta/ }),
    "Ana Perez",
  );
  await user.click(
    screen.getByRole("checkbox", { name: /Acepto los términos/ }),
  );
}

describe("PaymentForm", () => {
  it("shows the demo banner and a pay button with the total", () => {
    renderForm();

    expect(
      screen.getByRole("note", { name: "Modo demostración" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `Pagar S/${NBSP}389.80` }),
    ).toHaveAttribute("type", "submit");
  });

  it("checks the card on the client before posting", async () => {
    const { user, action } = renderForm();

    await user.type(
      screen.getByRole("textbox", { name: /Número de tarjeta/ }),
      "4111 1111 1111 1112",
    );
    await user.click(screen.getByRole("button", { name: /Pagar/ }));

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(
      within(summary).getByRole("link", {
        name: "Revisa el número de tu tarjeta.",
      }),
    ).toHaveAttribute("href", "#pago-number");
    expect(
      within(summary).getByRole("link", {
        name: "Acepta los términos y condiciones para continuar.",
      }),
    ).toHaveAttribute("href", "#pago-terms");
    expect(action).not.toHaveBeenCalled();
  });

  it("posts a valid card", async () => {
    const { user, action } = renderForm();

    await fillCard(user, "4111 1111 1111 1111");
    await user.click(screen.getByRole("button", { name: /Pagar/ }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = vi.mocked(action).mock.calls[0]?.[1] as FormData;
    expect(data.get("cardNumber")).toBe("4111 1111 1111 1111");
    expect(data.get("acceptTerms")).toBe("si");
    // What the page showed, so the server can refuse a stale page.
    expect(data.get("expectedTotal")).toBe("38980");
    expect(data.get("quoteFingerprint")).toBe("1a2b3c4d");
  });

  it("keeps the quote in the form itself, so it posts without JavaScript too", () => {
    const { container } = renderForm();
    const form = container.querySelector("form") as HTMLFormElement;
    const data = new FormData(form);
    expect(data.get("expectedTotal")).toBe("38980");
    expect(data.get("quoteFingerprint")).toBe("1a2b3c4d");
  });

  it("explains a declined payment with the server's message and focuses it", async () => {
    const action = vi.fn<PayAction>(async (state) => ({
      ...state,
      formError: {
        title: "No pudimos procesar el pago",
        message: "Tu banco rechazó la tarjeta.",
      },
      attempt: state.attempt + 1,
    }));
    const { user } = renderForm(action);

    await fillCard(user, "4000 0000 0000 0002");
    await user.click(screen.getByRole("button", { name: /Pagar/ }));

    const summary = await screen.findByRole("region", {
      name: "No pudimos procesar el pago",
    });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary).toHaveTextContent("Tu banco rechazó la tarjeta.");
  });

  it("lists what changed in the cart", async () => {
    const action = vi.fn<PayAction>(async (state) => ({
      ...state,
      formError: {
        title: "Tu carrito cambió",
        message: "Revisa el nuevo total.",
        details: ["Prime Charger 100W: ahora cuesta S/ 199.90."],
      },
      attempt: state.attempt + 1,
    }));
    const { user } = renderForm(action);

    await fillCard(user, "4111 1111 1111 1111");
    await user.click(screen.getByRole("button", { name: /Pagar/ }));

    const summary = await screen.findByRole("region", {
      name: "Tu carrito cambió",
    });
    expect(within(summary).getByRole("listitem")).toHaveTextContent(
      "Prime Charger 100W: ahora cuesta S/ 199.90.",
    );
  });

  it("has no axe violations, empty or with errors", async () => {
    const { container, user } = renderForm();
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: /Pagar/ }));
    await screen.findByRole("region", { name: "Revisa estos datos" });
    await expectNoAxeViolations(container);
  });
});
