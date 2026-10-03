import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReceiptPage, {
  metadata as receiptMetadata,
} from "@/app/(transactional)/checkout/comprobante/page";
import ConfirmationPage, {
  metadata as confirmationMetadata,
} from "@/app/(transactional)/checkout/confirmacion/[number]/page";
import ContactPage, {
  metadata as contactMetadata,
} from "@/app/(transactional)/checkout/contacto/page";
import CheckoutPage from "@/app/(transactional)/checkout/page";
import PaymentPage, {
  metadata as paymentMetadata,
} from "@/app/(transactional)/checkout/pago/page";
import type {
  PayAction,
  PendingPaymentLookup,
} from "@/modules/checkout/ui/pay-action";
import { placeOrderAction } from "@/modules/orders/ui/actions";
import { findPendingPayment } from "@/modules/orders/ui/pending-payment";

vi.mock("@/modules/checkout/ui/checkout-step.containers", () => ({
  redirectToPendingStep: async () => {
    throw new Error("NEXT_REDIRECT:/checkout/contacto");
  },
  ContactStepContainer: () => <p>Paso contacto</p>,
  ReceiptStepContainer: () => <p>Paso comprobante</p>,
  PaymentStepContainer: ({
    pay,
    pendingPayment,
  }: {
    pay: PayAction;
    pendingPayment: PendingPaymentLookup;
  }) => (
    <p
      data-pay={pay === placeOrderAction ? "conectado" : "no"}
      data-pending={pendingPayment === findPendingPayment ? "conectado" : "no"}
    >
      Paso pago
    </p>
  ),
}));

vi.mock("@/modules/orders/ui/pending-payment", () => ({
  findPendingPayment: async () => null,
}));

vi.mock("@/modules/orders/ui/actions", () => ({
  placeOrderAction: async () => ({}),
}));

vi.mock("@/modules/orders/ui/order-confirmation.container", () => ({
  OrderConfirmationContainer: ({ number }: { number: string }) => (
    <p>Confirmación {number}</p>
  ),
}));

const NOINDEX = { index: false };

describe("checkout routes", () => {
  it("sends /checkout to the step to do", async () => {
    await expect(CheckoutPage()).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/contacto",
    );
  });

  it("renders each step with its own title, out of search engines", async () => {
    render(<ContactPage />);
    render(<ReceiptPage />);
    render(<PaymentPage />);

    expect(screen.getByText("Paso contacto")).toBeInTheDocument();
    expect(screen.getByText("Paso comprobante")).toBeInTheDocument();
    expect(contactMetadata).toEqual({
      title: "Contacto y envío",
      robots: NOINDEX,
    });
    expect(receiptMetadata).toEqual({ title: "Comprobante", robots: NOINDEX });
    expect(paymentMetadata).toEqual({ title: "Pago", robots: NOINDEX });
  });

  it("connects the payment step to the orders module", () => {
    render(<PaymentPage />);
    const step = screen.getByText("Paso pago");
    expect(step).toHaveAttribute("data-pay", "conectado");
    // It also asks the orders module whether this cart already paid.
    expect(step).toHaveAttribute("data-pending", "conectado");
  });

  it("renders the confirmation of the order in the URL", async () => {
    render(
      await ConfirmationPage({
        params: Promise.resolve({ number: "MG-2026-424242" }),
      } as Parameters<typeof ConfirmationPage>[0]),
    );
    expect(screen.getByText("Confirmación MG-2026-424242")).toBeInTheDocument();
    expect(confirmationMetadata).toEqual({
      title: "Pedido confirmado",
      robots: NOINDEX,
    });
  });
});
