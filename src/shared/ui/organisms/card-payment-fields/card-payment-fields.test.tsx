import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CardPaymentFields } from "./card-payment-fields";

describe("CardPaymentFields", () => {
  it("announces the demo mode with the test cards", () => {
    render(<CardPaymentFields idPrefix="pago" termsHref="/terminos" />);

    const banner = screen.getByRole("note", { name: "Modo demostración" });
    expect(banner).toHaveTextContent("4111 1111 1111 1111");
    expect(banner).toHaveTextContent("4000 0000 0000 0002");
  });

  it("hides the banner outside demo mode", () => {
    render(
      <CardPaymentFields idPrefix="pago" termsHref="/terminos" demo={false} />,
    );
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("asks for the card with payment autocomplete hints and numeric keyboards", () => {
    render(<CardPaymentFields idPrefix="pago" termsHref="/terminos" />);

    const number = screen.getByRole("textbox", {
      name: "Número de tarjeta (obligatorio)",
    });
    expect(number).toHaveAttribute("autocomplete", "cc-number");
    expect(number).toHaveAttribute("inputmode", "numeric");
    expect(number).toHaveAttribute("name", "cardNumber");
    expect(
      screen.getByRole("textbox", {
        name: "Vencimiento (MM/AA) (obligatorio)",
      }),
    ).toHaveAttribute("autocomplete", "cc-exp");
    const cvv = screen.getByRole("textbox", { name: "CVV (obligatorio)" });
    expect(cvv).toHaveAttribute("autocomplete", "cc-csc");
    expect(cvv).toHaveAccessibleDescription(
      "3 o 4 dígitos, al reverso de tu tarjeta.",
    );
    expect(
      screen.getByRole("textbox", {
        name: "Nombre en la tarjeta (obligatorio)",
      }),
    ).toHaveAttribute("autocomplete", "cc-name");
  });

  it("asks to accept the terms with a link to them", () => {
    render(<CardPaymentFields idPrefix="pago" termsHref="/terminos" />);

    const terms = screen.getByRole("checkbox", {
      name: "Acepto los términos y condiciones de compra",
    });
    expect(terms).toBeRequired();
    expect(terms).toHaveAttribute("name", "acceptTerms");
    expect(
      screen.getByRole("link", { name: "términos y condiciones de compra" }),
    ).toHaveAttribute("href", "/terminos");
  });

  it("shows errors and passes extra props to the controls", () => {
    render(
      <CardPaymentFields
        idPrefix="pago"
        termsHref="/terminos"
        errors={{
          number: "Revisa el número de tu tarjeta.",
          terms: "Acepta los términos para continuar.",
        }}
        inputProps={{ number: { "data-testid": "numero" } as never }}
      />,
    );

    const number = screen.getByRole("textbox", { name: /Número de tarjeta/ });
    expect(number).toBeInvalid();
    expect(number).toHaveAccessibleDescription(
      "Revisa el número de tu tarjeta.",
    );
    expect(number).toHaveAttribute("data-testid", "numero");
    const terms = screen.getByRole("checkbox");
    expect(terms).toBeInvalid();
    expect(terms).toHaveAccessibleDescription(
      "Acepta los términos para continuar.",
    );
  });

  it("has no axe violations, with and without errors", async () => {
    const { container } = render(
      <form>
        <CardPaymentFields idPrefix="a" termsHref="/terminos" />
        <CardPaymentFields
          idPrefix="b"
          termsHref="/terminos"
          legend="Tarjeta con errores"
          errors={{
            number: "Revisa el número.",
            expiry: "Revisa el vencimiento.",
            cvv: "Revisa el CVV.",
            holder: "Escribe el nombre.",
            terms: "Acepta los términos.",
          }}
        />
      </form>,
    );
    await expectNoAxeViolations(container);
  });
});
