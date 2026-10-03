// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  A_PROVIDER,
  aComplaintSheet,
} from "@/modules/complaints/testing/complaint-builders";
import { complaintReceiptView, providerItems } from "./complaint-view";

const NBSP = " ";

function sectionItems(
  view: ReturnType<typeof complaintReceiptView>,
  index: number,
) {
  return Object.fromEntries(
    (view.sections[index]?.items ?? []).map((item) => [
      item.term,
      item.details,
    ]),
  );
}

describe("providerItems", () => {
  it("says 'Por definir' for the identity still pending", () => {
    expect(providerItems(A_PROVIDER)).toEqual([
      { term: "Nombre comercial", details: "Migeanje Store" },
      { term: "Razón social o nombre", details: "Por definir" },
      { term: "RUC", details: "Por definir", mono: true },
      { term: "Domicilio", details: "Por definir" },
    ]);
  });

  it("shows the identity once it is set", () => {
    const items = providerItems({
      tradeName: "Migeanje Store",
      legalName: "Miguel Valdivia",
      ruc: "10460278971",
      address: "Av. Arequipa 123, Lima",
    });

    expect(items.map((item) => item.details)).toEqual([
      "Migeanje Store",
      "Miguel Valdivia",
      "10460278971",
      "Av. Arequipa 123, Lima",
    ]);
  });
});

describe("complaintReceiptView", () => {
  it("titles the constancia by kind with the number and Lima time", () => {
    const view = complaintReceiptView(aComplaintSheet());

    expect(view.title).toBe("Registramos tu reclamo");
    expect(view.number).toBe("000000001-2026");
    expect(view.filedAt.dateTime).toBe("2026-10-03T15:00:00.000Z");
    expect(view.filedAt.label).toMatch(/3 oct\.? 2026/);
    expect(view.filedAt.label).toMatch(/10:00/);
    expect(
      complaintReceiptView(
        aComplaintSheet({
          claim: { ...aComplaintSheet().claim, kind: "queja" },
        }),
      ).title,
    ).toBe("Registramos tu queja");
  });

  it("says where the copy went, or that it could not be sent", () => {
    const sent = complaintReceiptView(
      aComplaintSheet({ copySentAt: "2026-10-03T15:00:02.000Z" }),
    );
    expect(sent.copy).toEqual({
      sent: true,
      text: "Te enviamos una copia de esta Hoja de Reclamación a ana@correo.pe.",
    });

    const failed = complaintReceiptView(aComplaintSheet({ copySentAt: null }));
    expect(failed.copy.sent).toBe(false);
    expect(failed.copy.text).toMatch(/No pudimos enviarte la copia/);
  });

  it("gives the due date with the channel the consumer chose", () => {
    expect(complaintReceiptView(aComplaintSheet()).due).toBe(
      "Te responderemos por correo a más tardar el viernes 23 de octubre de 2026.",
    );
    expect(
      complaintReceiptView(aComplaintSheet({ responseChannel: "carta" })).due,
    ).toBe(
      "Te responderemos por carta a tu domicilio a más tardar el viernes 23 de octubre de 2026.",
    );
  });

  it("lists the consumer as in section 1 of the Hoja", () => {
    const view = complaintReceiptView(aComplaintSheet());

    expect(view.sections[0]?.title).toBe(
      "1. Identificación del consumidor reclamante",
    );
    expect(sectionItems(view, 0)).toEqual({
      Nombre: "Ana Pérez Quispe",
      Documento: "DNI 46027897",
      Domicilio: ["Av. Larco 1234, dpto. 501", "Miraflores, Lima, Lima"],
      Teléfono: "987654321",
      "Correo electrónico": "ana@correo.pe",
    });
  });

  it("adds the parent or representative of a minor", () => {
    const sheet = aComplaintSheet();
    const view = complaintReceiptView({
      ...sheet,
      consumer: {
        ...sheet.consumer,
        phone: null,
        guardian: {
          fullName: "Rosa Quispe Mamani",
          address: null,
          phone: "987000111",
          email: null,
        },
      },
    });

    expect(sectionItems(view, 0)).toMatchObject({
      Teléfono: "No indicado",
      "Madre, padre o representante (menor de edad)": [
        "Rosa Quispe Mamani",
        "987000111",
      ],
    });
  });

  it("shows the good, the claim and the pending answer", () => {
    const view = complaintReceiptView(aComplaintSheet());

    expect(sectionItems(view, 1)).toEqual({
      "Producto o servicio": "Producto",
      "Número de pedido": "MG-2026-000123",
      "Monto reclamado": `S/${NBSP}189.90`,
      Descripción: "Cargador Prime 100W, 3 puertos",
    });
    expect(sectionItems(view, 2)).toEqual({
      Tipo: "Reclamo",
      Detalle: "El cargador dejó de funcionar a la semana de recibirlo.",
      Pedido: "Cambio del producto por uno nuevo.",
      Respuesta: "Por correo electrónico",
      Declaración:
        "Declaraste que los datos y los hechos descritos son verdaderos.",
    });
    expect(sectionItems(view, 3)).toEqual({
      "Observaciones y acciones adoptadas":
        "Pendiente. Aquí registraremos nuestra respuesta y la fecha en que te la comuniquemos.",
      "Plazo para responderte":
        "A más tardar el viernes 23 de octubre de 2026 (15 días hábiles, improrrogables).",
      "Fecha de comunicación de la respuesta": "Pendiente",
    });
  });

  it("marks what the consumer left empty", () => {
    const sheet = aComplaintSheet();
    const view = complaintReceiptView({
      ...sheet,
      goods: {
        type: "servicio",
        orderNumber: null,
        amount: null,
        description: null,
      },
      claim: { ...sheet.claim, request: null },
    });

    expect(sectionItems(view, 1)).toMatchObject({
      "Producto o servicio": "Servicio",
      "Número de pedido": "No indicado",
      "Monto reclamado": "No indicado",
      Descripción: "No indicado",
    });
    expect(sectionItems(view, 2).Pedido).toBe("No indicado");
  });

  it("prints the legal notes with the Hoja's definitions", () => {
    const view = complaintReceiptView(aComplaintSheet());

    expect(view.legalNotes).toEqual([
      "Reclamo: Disconformidad relacionada a los productos o servicios.",
      "Queja: Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.",
      "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.",
      "El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual es improrrogable.",
    ]);
    expect(view.recipient).toBe("Destinatario: consumidor (tu copia)");
    expect(view.homeHref).toBe("/");
  });

  it("never exposes the access token", () => {
    const view = complaintReceiptView(aComplaintSheet());

    expect(JSON.stringify(view)).not.toContain(aComplaintSheet().accessToken);
  });
});
