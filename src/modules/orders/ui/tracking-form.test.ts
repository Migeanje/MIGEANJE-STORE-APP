// @vitest-environment node
import { describe, expect, it } from "vitest";
import { fieldErrorsOf } from "@/modules/checkout/ui/checkout-forms";
import {
  type TrackingField,
  trackingFormSchema,
  trackingInitialState,
} from "./tracking-form";

function errorsOf(values: Record<TrackingField, string>) {
  const result = trackingFormSchema.safeParse(values);
  return result.success ? {} : fieldErrorsOf<TrackingField>(result.error);
}

describe("trackingFormSchema", () => {
  it("normalizes the number and the email", () => {
    expect(
      trackingFormSchema.parse({
        number: " mg 2026 004521 ",
        email: " Ana@Correo.PE ",
      }),
    ).toEqual({ number: "MG-2026-004521", email: "ana@correo.pe" });
  });

  it("asks for both fields", () => {
    expect(errorsOf({ number: " ", email: "" })).toEqual({
      number: "Escribe tu número de pedido.",
      email: "Escribe tu correo electrónico.",
    });
  });

  it("explains a malformed number or email", () => {
    expect(errorsOf({ number: "MG-2026-45", email: "ana@" })).toEqual({
      number: "Revisa el número de pedido: tiene la forma MG-2026-004521.",
      email: "Revisa tu correo: debe ser como nombre@correo.com.",
    });
  });
});

describe("trackingInitialState", () => {
  it("prefills only a well-formed number from ?numero=", () => {
    expect(trackingInitialState("mg-2026-004521").values).toEqual({
      number: "MG-2026-004521",
    });
    expect(trackingInitialState("<script>").values).toEqual({});
    expect(trackingInitialState(undefined).values).toEqual({});
    expect(trackingInitialState("MG-2026-004521".repeat(10)).values).toEqual(
      {},
    );
  });

  it("starts without errors", () => {
    expect(trackingInitialState(undefined)).toEqual({
      values: {},
      errors: {},
      formError: null,
      attempt: 0,
    });
  });
});
