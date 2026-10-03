// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_PATHS,
  logInHref,
  noticeFrom,
  registerHref,
  safeReturnPath,
  withNotice,
} from "./account-paths";

describe("safeReturnPath", () => {
  it.each([
    "/cuenta/perfil",
    "/productos/anker-prime-charger-100w-3-puertos?variante=ank-a2688",
    "/categorias/cargadores?marca=anker#resultados",
    "/",
  ])("keeps a path of this site: %s", (path) => {
    expect(safeReturnPath(path)).toBe(path);
  });

  it("normalizes dot segments", () => {
    expect(safeReturnPath("/productos/../cuenta/pedidos")).toBe(
      "/cuenta/pedidos",
    );
  });

  it.each([
    ["another site", "https://evil.example/cuenta"],
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash trick", "/\\evil.example"],
    ["backslashes", "\\\\evil.example"],
    ["a tab inside", "/\t/evil.example"],
    ["a line break", "/cuenta\nSet-Cookie: x"],
    ["a script URL", "javascript:alert(1)"],
    ["a relative path", "cuenta"],
    ["a leading space", " /cuenta"],
    ["an empty value", ""],
    ["a very long value", `/${"a".repeat(600)}`],
    ["the sign-in page itself", "/cuenta/ingresar?volver=/cuenta"],
    ["the registration page", "/cuenta/registro"],
  ])("falls back to the account for %s", (_name, value) => {
    expect(safeReturnPath(value)).toBe(ACCOUNT_PATHS.home);
  });

  it("falls back for values that are not text, or to a given path", () => {
    expect(safeReturnPath(undefined)).toBe("/cuenta");
    expect(safeReturnPath(["/cuenta/perfil"])).toBe("/cuenta");
    expect(safeReturnPath(null, "/")).toBe("/");
  });
});

describe("account links", () => {
  it("send the customer back after signing in", () => {
    expect(logInHref()).toBe("/cuenta/ingresar");
    expect(logInHref("/productos/x?variante=y")).toBe(
      "/cuenta/ingresar?volver=%2Fproductos%2Fx%3Fvariante%3Dy",
    );
    expect(logInHref("/cuenta")).toBe("/cuenta/ingresar");
    expect(logInHref("https://evil.example")).toBe("/cuenta/ingresar");
    expect(registerHref("/cuenta/favoritos")).toBe(
      "/cuenta/registro?volver=%2Fcuenta%2Ffavoritos",
    );
  });

  it("carry a notice key after a change", () => {
    expect(withNotice("/cuenta/perfil", "perfil-guardado")).toBe(
      "/cuenta/perfil?aviso=perfil-guardado",
    );
  });
});

describe("noticeFrom", () => {
  const NOTICES = { "perfil-guardado": "Guardamos tus datos." };

  it("reads a known notice from ?aviso=", () => {
    expect(noticeFrom({ aviso: "perfil-guardado" }, NOTICES)).toBe(
      "Guardamos tus datos.",
    );
  });

  it("ignores unknown, repeated or missing notices", () => {
    expect(noticeFrom({ aviso: "hackeado" }, NOTICES)).toBeNull();
    expect(noticeFrom({ aviso: ["perfil-guardado"] }, NOTICES)).toBeNull();
    expect(noticeFrom({}, NOTICES)).toBeNull();
    expect(noticeFrom({ aviso: "toString" }, NOTICES)).toBeNull();
  });
});
