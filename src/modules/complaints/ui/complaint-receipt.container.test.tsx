import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComplaintSheet } from "@/modules/complaints/domain/complaint";
import { getComplaintRepository } from "@/modules/complaints/infrastructure";
import {
  aNewComplaint,
  COMPLAINT_ACCESS_TOKEN,
} from "@/modules/complaints/testing/complaint-builders";
import { expectNoAxeViolations } from "@/test/a11y";
import { ComplaintReceiptContainer } from "./complaint-receipt.container";

vi.mock("server-only", () => ({}));

const access = vi.hoisted(() => ({
  value: null as null | { number: string; accessToken: string },
}));
vi.mock("@/modules/complaints/infrastructure/complaint-access-cookie", () => ({
  readComplaintAccess: async () => access.value,
}));

let sheet: ComplaintSheet;

beforeAll(async () => {
  sheet = await getComplaintRepository().file(aNewComplaint());
});

beforeEach(() => {
  access.value = null;
});

describe("ComplaintReceiptContainer", () => {
  it("shows the constancia to the browser that filed it", async () => {
    access.value = {
      number: sheet.number,
      accessToken: COMPLAINT_ACCESS_TOKEN,
    };

    render(await ComplaintReceiptContainer({ number: sheet.number }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Registramos tu reclamo" }),
    ).toBeInTheDocument();
    expect(screen.getByText(sheet.number)).toHaveClass("font-mono");
    expect(
      screen.getByRole("region", {
        name: "1. Identificación del consumidor reclamante",
      }),
    ).toHaveTextContent("DNI 46027897");
    expect(
      screen.getByRole("button", { name: "Imprimir o guardar como PDF" }),
    ).toBeInTheDocument();
  });

  it("hides the sheet from anyone else", async () => {
    const { unmount } = render(
      await ComplaintReceiptContainer({ number: sheet.number }),
    );
    expect(
      screen.getByRole("heading", {
        name: "No podemos mostrar esta constancia",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/46027897/)).toBeNull();
    expect(
      screen.getByRole("link", { name: "Ir al Libro de Reclamaciones" }),
    ).toHaveAttribute("href", "/libro-de-reclamaciones");
    unmount();

    access.value = {
      number: sheet.number,
      accessToken: "00000000-0000-4000-8000-000000000000",
    };
    const wrongToken = render(
      await ComplaintReceiptContainer({ number: sheet.number }),
    );
    expect(screen.queryByText(/46027897/)).toBeNull();
    wrongToken.unmount();

    access.value = {
      number: sheet.number,
      accessToken: COMPLAINT_ACCESS_TOKEN,
    };
    render(await ComplaintReceiptContainer({ number: "000000999-2026" }));
    expect(screen.queryByText(/46027897/)).toBeNull();
  });

  it("has no axe violations (constancia and no access)", async () => {
    access.value = {
      number: sheet.number,
      accessToken: COMPLAINT_ACCESS_TOKEN,
    };
    const { container, unmount } = render(
      await ComplaintReceiptContainer({ number: sheet.number }),
    );
    await expectNoAxeViolations(container);
    unmount();

    access.value = null;
    const denied = render(
      await ComplaintReceiptContainer({ number: sheet.number }),
    );
    await expectNoAxeViolations(denied.container);
  });
});
