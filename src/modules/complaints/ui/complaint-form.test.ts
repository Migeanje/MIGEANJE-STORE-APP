// @vitest-environment node
import { describe, expect, it } from "vitest";
import { fieldErrorsOf } from "@/modules/checkout/ui/checkout-forms";
import { aFileComplaintInput } from "@/modules/complaints/testing/complaint-builders";
import {
  COMPLAINT_FIELDS,
  type ComplaintFormValues,
  complaintFormInitialState,
  complaintFormSchema,
} from "./complaint-form";

/** What the form posts for `aFileComplaintInput()`. */
function filled(
  overrides: Partial<ComplaintFormValues> = {},
): ComplaintFormValues {
  return {
    firstName: "Ana",
    lastName: "Pérez Quispe",
    documentType: "dni",
    documentNumber: "46027897",
    email: "Ana@Correo.pe ",
    phone: "+51 987 654 321",
    addressLine: "Av. Larco 1234, dpto. 501",
    departamento: "15",
    provincia: "1501",
    distrito: "150122",
    isMinor: "",
    guardianName: "",
    guardianAddress: "",
    guardianPhone: "",
    guardianEmail: "",
    goodType: "producto",
    orderNumber: "mg 2026 000123",
    amount: "189,90",
    goodDescription: "Cargador Prime 100W, 3 puertos",
    kind: "reclamo",
    detail: "El cargador dejó de funcionar a la semana de recibirlo.",
    request: "Cambio del producto por uno nuevo.",
    responseChannel: "email",
    acceptDeclaration: "si",
    ...overrides,
  };
}

function errorsOf(values: Record<string, unknown>): Record<string, string> {
  const result = complaintFormSchema.safeParse(values);
  // The first message of each field, as the server action answers it.
  return result.success
    ? {}
    : (fieldErrorsOf(result.error) as Record<string, string>);
}

describe("complaintFormSchema", () => {
  it("turns the posted fields into the Hoja to file (normalized)", () => {
    expect(complaintFormSchema.parse(filled())).toEqual(aFileComplaintInput());
  });

  it("lists every field once", () => {
    expect(new Set(COMPLAINT_FIELDS).size).toBe(COMPLAINT_FIELDS.length);
    expect(Object.keys(filled()).sort()).toEqual([...COMPLAINT_FIELDS].sort());
  });

  it("asks only for what the law needs to file a claim", () => {
    const minimal = filled({
      phone: "",
      orderNumber: "",
      amount: "",
      goodDescription: "",
      request: "",
      goodType: "servicio",
      kind: "queja",
    });

    const parsed = complaintFormSchema.parse(minimal);

    expect(parsed.consumer.phone).toBeNull();
    expect(parsed.goods).toEqual({
      type: "servicio",
      orderNumber: null,
      amount: null,
      description: null,
    });
    expect(parsed.claim.request).toBeNull();
  });

  it("explains every missing required field in Spanish", () => {
    const errors = errorsOf(
      Object.fromEntries(COMPLAINT_FIELDS.map((field) => [field, ""])),
    );

    expect(errors).toMatchObject({
      firstName: "Escribe tus nombres.",
      lastName: "Escribe tus apellidos.",
      documentType: "Elige el tipo de documento.",
      documentNumber: "Escribe el número de tu documento.",
      email: "Escribe tu correo electrónico.",
      addressLine: "Escribe tu domicilio.",
      departamento: "Elige tu departamento.",
      goodType: "Elige si es un producto o un servicio.",
      kind: "Elige si es un reclamo o una queja.",
      detail: "Cuéntanos qué pasó.",
      responseChannel: "Elige cómo quieres recibir nuestra respuesta.",
      acceptDeclaration:
        "Confirma que los datos y hechos son verdaderos para enviar tu Hoja.",
    });
    expect(errors).not.toHaveProperty("phone");
    expect(errors).not.toHaveProperty("request");
  });

  it("reads unselected radios and unchecked boxes from React Hook Form", () => {
    const errors = errorsOf({
      ...filled(),
      kind: null,
      isMinor: false,
      acceptDeclaration: false,
    });

    expect(errors.kind).toBe("Elige si es un reclamo o una queja.");
    expect(errors.acceptDeclaration).toMatch(/Confirma/);
    expect(
      complaintFormSchema.safeParse({ ...filled(), acceptDeclaration: true })
        .success,
    ).toBe(true);
  });

  it("checks the document number for its type", () => {
    expect(errorsOf(filled({ documentNumber: "123" })).documentNumber).toBe(
      "El DNI tiene 8 dígitos.",
    );
    expect(
      errorsOf(filled({ documentType: "ce", documentNumber: "12" }))
        .documentNumber,
    ).toBe("El carné de extranjería tiene de 9 a 12 letras o números.");
  });

  it("refuses a malformed phone, order number or amount", () => {
    const errors = errorsOf(
      filled({ phone: "12", orderNumber: "123", amount: "1,299.90" }),
    );

    expect(errors.phone).toBe(
      "Escribe solo los números de tu teléfono, de 6 a 15 dígitos.",
    );
    expect(errors.orderNumber).toBe(
      "Revisa el número de pedido: tiene la forma MG-2026-004521.",
    );
    expect(errors.amount).toBe(
      "Escribe el monto en soles, por ejemplo 129.90.",
    );
  });

  it("refuses a distrito of another provincia", () => {
    expect(errorsOf(filled({ distrito: "040103" })).distrito).toBe(
      "Ese distrito no es de la provincia que elegiste.",
    );
  });

  it("needs the name of a parent or representative for a minor", () => {
    expect(errorsOf(filled({ isMinor: "si" })).guardianName).toBe(
      "Escribe el nombre de tu madre, padre o representante.",
    );

    const parsed = complaintFormSchema.parse(
      filled({
        isMinor: "si",
        guardianName: "Rosa Quispe Mamani",
        guardianEmail: "Rosa@Correo.pe",
        guardianPhone: "987 000 111",
      }),
    );

    expect(parsed.consumer.guardian).toEqual({
      fullName: "Rosa Quispe Mamani",
      address: null,
      phone: "987000111",
      email: "rosa@correo.pe",
    });
  });

  it("ignores the guardian fields of an adult", () => {
    const parsed = complaintFormSchema.parse(
      filled({
        guardianName: "R".repeat(200),
        guardianEmail: "no-es-un-correo",
      }),
    );

    expect(parsed.consumer.guardian).toBeNull();
  });

  it("checks the guardian's contact data when given", () => {
    const errors = errorsOf(
      filled({
        isMinor: "si",
        guardianName: "Rosa",
        guardianEmail: "rosa@",
        guardianPhone: "1",
      }),
    );

    expect(errors.guardianEmail).toBe(
      "Revisa tu correo: debe ser como nombre@correo.com.",
    );
    expect(errors.guardianPhone).toBe(
      "Escribe solo los números de tu teléfono, de 6 a 15 dígitos.",
    );
  });

  it("limits long texts", () => {
    const errors = errorsOf(
      filled({ detail: "a".repeat(4001), request: "b".repeat(2001) }),
    );

    expect(errors.detail).toBe("Usa 4000 caracteres como máximo.");
    expect(errors.request).toBe("Usa 2000 caracteres como máximo.");
  });
});

describe("complaintFormInitialState", () => {
  it("starts with a DNI, a product and an answer by email", () => {
    expect(complaintFormInitialState().values).toEqual({
      documentType: "dni",
      goodType: "producto",
      responseChannel: "email",
    });
  });

  it("prefills only a well-formed order number from ?pedido=", () => {
    expect(complaintFormInitialState("mg-2026-000123").values).toMatchObject({
      orderNumber: "MG-2026-000123",
    });
    expect(
      complaintFormInitialState("<script>").values.orderNumber,
    ).toBeUndefined();
    expect(
      complaintFormInitialState(`MG-2026-000123${" ".repeat(40)}`).values
        .orderNumber,
    ).toBeUndefined();
  });
});
