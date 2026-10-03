import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { anAccount } from "@/modules/account/testing/account-builders";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  LogInPageContainer,
  RecoverPageContainer,
  RegisterPageContainer,
} from "./auth-pages.containers";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));
vi.mock("./actions", () => ({
  logInAction: vi.fn(),
  registerAction: vi.fn(),
  recoverAction: vi.fn(),
}));

const session = vi.hoisted(() => ({
  account: null as ReturnType<typeof anAccount> | null,
}));
vi.mock("./account-session", () => ({
  loadSignedInAccount: async () => session.account,
}));

const demo = vi.hoisted(() => ({
  hint: { email: "demo@migeanje.pe", password: "Demo-2026!" } as {
    email: string;
    password: string;
  } | null,
}));
vi.mock("@/modules/account/infrastructure", () => ({
  getDemoAccountHint: () => demo.hint,
}));

beforeEach(() => {
  session.account = null;
  demo.hint = { email: "demo@migeanje.pe", password: "Demo-2026!" };
});

describe("LogInPageContainer", () => {
  it("asks a guest for email and password, with the way to recover or register", async () => {
    const { container } = render(
      await LogInPageContainer({ searchParams: {} }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Ingresa a tu cuenta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
    ).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText(/Contraseña/)).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" }),
    ).toHaveAttribute("href", "/cuenta/recuperar");
    expect(
      screen.getByRole("link", { name: "Crea una cuenta" }),
    ).toHaveAttribute("href", "/cuenta/registro");
    await expectNoAxeViolations(container);
  });

  it("shows the demo account only with mock data", async () => {
    render(await LogInPageContainer({ searchParams: {} }));
    const hint = screen.getByRole("region", { name: "Datos de demostración" });
    expect(hint).toHaveTextContent("demo@migeanje.pe");
    expect(hint).toHaveTextContent("Demo-2026!");
  });

  it("hides the demo hint without mock data", async () => {
    demo.hint = null;
    render(await LogInPageContainer({ searchParams: {} }));
    expect(
      screen.queryByRole("region", { name: "Datos de demostración" }),
    ).toBeNull();
  });

  it("keeps a safe return address for after signing in", async () => {
    const { container } = render(
      await LogInPageContainer({
        searchParams: { volver: "/productos/soundcore-liberty-5" },
      }),
    );

    expect(
      container.querySelector('input[type="hidden"][name="volver"]'),
    ).toHaveAttribute("value", "/productos/soundcore-liberty-5");
    expect(
      screen.getByRole("link", { name: "Crea una cuenta" }),
    ).toHaveAttribute(
      "href",
      "/cuenta/registro?volver=%2Fproductos%2Fsoundcore-liberty-5",
    );
  });

  it("drops a return address to another site", async () => {
    const { container } = render(
      await LogInPageContainer({ searchParams: { volver: "//evil.example" } }),
    );
    expect(container.querySelector('input[name="volver"]')).toBeNull();
  });

  it("confirms a sign-out", async () => {
    render(
      await LogInPageContainer({ searchParams: { aviso: "sesion-cerrada" } }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Cerraste tu sesión.");
  });

  it("sends a signed-in customer straight on", async () => {
    session.account = anAccount();
    await expect(
      LogInPageContainer({ searchParams: { volver: "/cuenta/pedidos" } }),
    ).rejects.toThrow("NEXT_REDIRECT:/cuenta/pedidos");
  });
});

describe("RegisterPageContainer", () => {
  it("asks for the account data with the password rules and the consent", async () => {
    const { container } = render(
      await RegisterPageContainer({ searchParams: {} }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Crea tu cuenta" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña/)).toHaveAccessibleDescription(
      "Tu contraseña necesita: entre 8 y 128 caracteres, al menos una letra y al menos un número.",
    );
    const consent = screen.getByRole("checkbox", {
      name: "Acepto los términos y condiciones y la política de privacidad.",
    });
    expect(consent).toBeRequired();
    expect(
      screen.getByRole("link", { name: "términos y condiciones" }),
    ).toHaveAttribute("href", "/terminos");
    expect(
      screen.getByRole("link", { name: "política de privacidad" }),
    ).toHaveAttribute("href", "/privacidad");
    expect(
      within(container).getByRole("link", { name: "Ingresa" }),
    ).toHaveAttribute("href", "/cuenta/ingresar");
    await expectNoAxeViolations(container);
  });

  it("sends a signed-in customer to the account", async () => {
    session.account = anAccount();
    await expect(RegisterPageContainer({ searchParams: {} })).rejects.toThrow(
      "NEXT_REDIRECT:/cuenta",
    );
  });
});

describe("RecoverPageContainer", () => {
  it("asks for the email of the account", async () => {
    const { container } = render(
      await RecoverPageContainer({ searchParams: {} }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Recupera tu contraseña" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar instrucciones" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
    await expectNoAxeViolations(container);
  });

  it("answers the same neutral message after any email", async () => {
    render(
      await RecoverPageContainer({ searchParams: { aviso: "correo-enviado" } }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Si existe una cuenta con ese correo, te enviamos un correo con los pasos para crear una nueva contraseña.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Modo demostración: no enviamos correos.",
    );
  });
});
