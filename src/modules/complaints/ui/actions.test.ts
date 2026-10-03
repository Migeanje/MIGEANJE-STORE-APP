// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMPLAINT_ACCESS_COOKIE } from "@/modules/complaints/infrastructure/complaint-access-cookie";
import { fileComplaintAction } from "./actions";
import { complaintFormInitialState } from "./complaint-form";

vi.mock("server-only", () => ({}));

const jar = new Map<string, string>();
const setCookie = vi.fn(
  (name: string, value: string, _options?: Record<string, unknown>) =>
    jar.set(name, value),
);
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: setCookie,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

// A fresh book per test (the mock book lives on globalThis).
const repository = vi.hoisted(() => ({ fail: false }));
vi.mock("@/modules/complaints/infrastructure", async () => {
  const { createInMemoryComplaintRepository } = await import(
    "@/modules/complaints/infrastructure/in-memory-complaint-repository"
  );
  const { createMockComplaintNotifier } = await import(
    "@/modules/complaints/infrastructure/mock-complaint-notifier"
  );
  let book = createInMemoryComplaintRepository();
  let notifier = createMockComplaintNotifier({ log: () => {} });
  return {
    reset() {
      book = createInMemoryComplaintRepository();
      notifier = createMockComplaintNotifier({ log: () => {} });
    },
    getComplaintRepository: () =>
      repository.fail
        ? {
            ...book,
            file: async () => {
              throw new Error("disk full");
            },
          }
        : book,
    getComplaintNotifier: () => notifier,
    getComplaintOutbox: () => notifier,
  };
});

const infrastructure = await import("@/modules/complaints/infrastructure");

const FILLED = {
  firstName: "Ana",
  lastName: "Pérez Quispe",
  documentType: "dni",
  documentNumber: "46027897",
  email: "ana@correo.pe",
  phone: "987654321",
  addressLine: "Av. Larco 1234, dpto. 501",
  departamento: "15",
  provincia: "1501",
  distrito: "150122",
  goodType: "producto",
  orderNumber: "MG-2026-000123",
  amount: "189.90",
  goodDescription: "Cargador Prime 100W",
  kind: "reclamo",
  detail: "Dejó de funcionar.",
  request: "Cambio del producto.",
  responseChannel: "email",
  acceptDeclaration: "si",
};

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

async function redirectOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const match = /^NEXT_REDIRECT:(.*)$/.exec((error as Error).message);
    if (match?.[1]) return match[1];
    throw error;
  }
  throw new Error("expected a redirect");
}

beforeEach(() => {
  jar.clear();
  setCookie.mockClear();
  repository.fail = false;
  (infrastructure as unknown as { reset(): void }).reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fileComplaintAction", () => {
  it("files the sheet, sends the copy and opens the constancia", async () => {
    const path = await redirectOf(
      fileComplaintAction(complaintFormInitialState(), form(FILLED)),
    );

    expect(path).toMatch(
      /^\/libro-de-reclamaciones\/constancia\/000000001-\d{4}$/,
    );
    const number = path.split("/").pop() as string;
    const [cookieNumber, token] = (
      jar.get(COMPLAINT_ACCESS_COOKIE) ?? ""
    ).split(".");
    expect(cookieNumber).toBe(number);
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
    expect(setCookie.mock.calls[0]?.[2]).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3600,
    });
    const outbox = await infrastructure.getComplaintOutbox()?.outbox();
    expect(outbox?.map((message) => message.to)).toEqual(["ana@correo.pe"]);
    const sheet = await infrastructure
      .getComplaintRepository()
      .findByNumber(number);
    expect(sheet?.copySentAt).not.toBeNull();
    expect(sheet?.provider.tradeName).toBe("Migeanje Store");
  });

  it("answers the field errors (server-authoritative) with what was typed", async () => {
    const state = await fileComplaintAction(
      complaintFormInitialState(),
      form({ ...FILLED, documentNumber: "123", acceptDeclaration: "" }),
    );

    expect(state.attempt).toBe(1);
    expect(state.errors).toEqual({
      documentNumber: "El DNI tiene 8 dígitos.",
      acceptDeclaration:
        "Confirma que los datos y hechos son verdaderos para enviar tu Hoja.",
    });
    expect(state.values.detail).toBe("Dejó de funcionar.");
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("refuses a distrito the directory does not know", async () => {
    const state = await fileComplaintAction(
      complaintFormInitialState(),
      form({
        ...FILLED,
        departamento: "15",
        provincia: "1501",
        distrito: "150199",
      }),
    );

    expect(state.errors).toEqual({
      distrito: "No encontramos ese distrito. Elige tu ubicación de nuevo.",
    });
  });

  it("re-renders the ubigeo options without JavaScript, filing nothing", async () => {
    const state = await fileComplaintAction(
      complaintFormInitialState(),
      form({
        ...FILLED,
        intent: "ubigeo",
        departamento: "04",
        provincia: "1501",
        distrito: "150122",
      }),
    );

    expect(state.values).toMatchObject({
      departamento: "04",
      provincia: "",
      distrito: "",
      detail: "Dejó de funcionar.",
    });
    expect(state.errors).toEqual({});
    expect(state.attempt).toBe(0);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("says nothing was filed when the book fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    repository.fail = true;

    const state = await fileComplaintAction(
      complaintFormInitialState(),
      form(FILLED),
    );

    expect(state.formError).toEqual({
      title: "No pudimos registrar tu Hoja de Reclamación",
      message:
        "Algo salió mal de nuestro lado y tu reclamo o queja no se registró. Espera un momento e inténtalo de nuevo.",
    });
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("still opens the constancia when the copy fails, logging no personal data", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(
      infrastructure.getComplaintNotifier(),
      "sendCopy",
    ).mockRejectedValue(new Error("SMTP down"));

    const path = await redirectOf(
      fileComplaintAction(complaintFormInitialState(), form(FILLED)),
    );

    expect(path).toMatch(/constancia\/000000001-/);
    const line = String(error.mock.calls[0]?.[0]);
    expect(JSON.parse(line)).toMatchObject({
      event: "complaint_copy_failed",
      failure: "SMTP down",
    });
    expect(line).not.toContain("ana@");
    expect(line).not.toContain("46027897");
  });
});
