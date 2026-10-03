import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  aBackorderOffer,
  aCart,
  aLine,
  CART_ID,
} from "@/modules/cart/testing/cart-builders";
import type { CheckoutDraft } from "@/modules/checkout/domain/checkout-draft";
import { paymentQuote } from "@/modules/checkout/domain/payment-quote";
import {
  aContact,
  aUbigeoTree,
  BOLETA,
  fakeUbigeo,
} from "@/modules/checkout/testing/checkout-builders";
import {
  ContactStepContainer,
  PaymentStepContainer,
  ReceiptStepContainer,
  redirectToPendingStep,
} from "./checkout-step.containers";
import type { PayAction, PendingPaymentLookup } from "./pay-action";

vi.mock("server-only", () => ({}));

const checkout = vi.hoisted(() => ({
  value: null as null | { cart: unknown; draft: unknown },
}));
vi.mock("./checkout-data", () => ({
  loadCheckout: async () => checkout.value,
}));
vi.mock("@/modules/checkout/infrastructure", () => ({
  getUbigeoDirectory: () => fakeUbigeo(aUbigeoTree()),
}));
vi.mock("./actions", () => ({
  saveContactAction: vi.fn(),
  saveReceiptAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

const NBSP = " ";
const cart = aCart([aLine({ quantity: 2 }), aLine({}, aBackorderOffer())]);

function withDraft(draft: Partial<CheckoutDraft>) {
  checkout.value = {
    cart,
    draft: { cartId: CART_ID, contact: null, receipt: null, ...draft },
  };
}

beforeEach(() => {
  checkout.value = null;
});

describe("ContactStepContainer", () => {
  it("sends an empty cart back to the cart page", async () => {
    await expect(ContactStepContainer()).rejects.toThrow(
      "NEXT_REDIRECT:/carrito",
    );
  });

  it("renders the steps, the summary without shipping and the contact form", async () => {
    withDraft({});
    render(await ContactStepContainer());

    expect(
      screen.getByRole("heading", { level: 1, name: "Finalizar compra" }),
    ).toBeInTheDocument();
    const steps = screen.getByRole("navigation", {
      name: "Pasos de la compra",
    });
    expect(
      within(steps).getByText("Contacto y envío").closest("[aria-current]"),
    ).toHaveAttribute("aria-current", "step");
    const summary = screen.getByRole("region", { name: "Resumen del pedido" });
    expect(summary).toHaveTextContent("Se calcula con tu dirección");
    expect(summary).toHaveTextContent("En importación · llega en 15–20 días");
    expect(
      screen.getByRole("link", { name: "Editar carrito" }),
    ).toHaveAttribute("href", "/carrito");
    expect(
      screen.getByRole("heading", { level: 2, name: "Contacto y envío" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
    ).toHaveValue("");
  });

  it("fills the form from the draft", async () => {
    withDraft({ contact: aContact() });
    render(await ContactStepContainer());
    expect(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
    ).toHaveValue("ana@correo.pe");
  });
});

describe("ReceiptStepContainer", () => {
  it("asks for the contact step first", async () => {
    withDraft({});
    await expect(ReceiptStepContainer()).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/contacto",
    );
  });

  it("confirms the boleta for the customer and prices shipping", async () => {
    withDraft({ contact: aContact() });
    render(await ReceiptStepContainer());

    expect(
      screen.getByText(/Ana Pérez Quispe · DNI 46027897/),
    ).toBeInTheDocument();
    const summary = screen.getByRole("region", { name: "Resumen del pedido" });
    expect(summary).toHaveTextContent("Envío a Lima Metropolitana");
    expect(
      within(steps()).getByRole("link", {
        name: "Paso 1: Contacto y envío (completado)",
      }),
    ).toHaveAttribute("href", "/checkout/contacto");
  });
});

function steps() {
  return screen.getByRole("navigation", { name: "Pasos de la compra" });
}

describe("PaymentStepContainer", () => {
  const pay = vi.fn<PayAction>();
  const noPendingPayment = vi.fn<PendingPaymentLookup>(async () => null);

  it("asks for the receipt first", async () => {
    withDraft({ contact: aContact() });
    await expect(
      PaymentStepContainer({ pay, pendingPayment: noPendingPayment }),
    ).rejects.toThrow("NEXT_REDIRECT:/checkout/comprobante");
  });

  it("shows the card form with the total to pay", async () => {
    withDraft({ contact: aContact(), receipt: BOLETA });
    const { container } = render(
      await PaymentStepContainer({ pay, pendingPayment: noPendingPayment }),
    );

    // 2 × 189.90 + 248.90 + 10.00 shipping to Lima.
    expect(
      screen.getByRole("button", { name: `Pagar S/${NBSP}638.70` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("note", { name: "Modo demostración" }),
    ).toBeInTheDocument();
    // The form posts back the quote it shows.
    const form = new FormData(
      container.querySelector("form") as HTMLFormElement,
    );
    const quote = paymentQuote(cart.lines, {
      departamento: "15",
      provincia: "1501",
    });
    expect(form.get("expectedTotal")).toBe("63870");
    expect(form.get("quoteFingerprint")).toBe(quote?.fingerprint);
  });

  it("shows a notice and no way to pay when the cart's payment awaits confirmation", async () => {
    withDraft({ contact: aContact(), receipt: BOLETA });
    const pendingPayment = vi.fn<PendingPaymentLookup>(async () => ({
      reference: "MG-2026-000777",
    }));

    const { container } = render(
      await PaymentStepContainer({ pay, pendingPayment }),
    );

    expect(pendingPayment).toHaveBeenCalledWith(CART_ID);
    const notice = screen.getByRole("region", {
      name: "Ya registramos un pago",
    });
    expect(notice).toHaveTextContent(
      "Ya registramos un pago para este carrito y lo estamos confirmando. No vuelvas a pagar; te escribiremos a tu correo.",
    );
    expect(notice).toHaveTextContent("Código de referencia");
    expect(notice).toHaveTextContent("MG-2026-000777");
    expect(screen.queryByRole("button", { name: /Pagar/ })).toBeNull();
    expect(container.querySelector("form")).toBeNull();
    // The summary still shows what was paid for.
    expect(
      screen.getByRole("region", { name: "Resumen del pedido" }),
    ).toBeInTheDocument();
  });
});

describe("redirectToPendingStep", () => {
  it("goes to the cart without lines, else to the first step to do", async () => {
    await expect(redirectToPendingStep()).rejects.toThrow(
      "NEXT_REDIRECT:/carrito",
    );
    withDraft({ contact: aContact() });
    await expect(redirectToPendingStep()).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/comprobante",
    );
  });
});
