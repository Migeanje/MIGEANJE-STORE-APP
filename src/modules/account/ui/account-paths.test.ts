// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ORDER_TRACKING_PATH } from "@/modules/orders/ui/order-paths";
import {
  ACCOUNT_PATHS,
  logInHref,
  noticeFrom,
  registerHref,
  safeReturnPath,
  TRACK_ORDER_PATH,
  withNotice,
} from "./account-paths";

describe("safeReturnPath", () => {
  it.each([
    "/cuenta/perfil",
    "/cuenta/pedidos",
    "/productos/x?variante=y#a",
    "/productos/anker-prime-charger-100w-3-puertos?variante=ank-a2688",
    "/categorias/cargadores?marca=anker#resultados",
    "/buscar?q=usb%2Fc",
    "/",
  ])("keeps a path of this site: %s", (path) => {
    expect(safeReturnPath(path)).toBe(path);
  });

  it("normalizes dot segments", () => {
    expect(safeReturnPath("/productos/../cuenta/pedidos")).toBe(
      "/cuenta/pedidos",
    );
  });

  // Each of these normalizes to "//evil.example", which a browser reads as
  // another site: the checks have to look at the normalized path.
  it.each([
    ["a dot segment", "/.//evil.example"],
    ["a parent segment", "/a/..//evil.example"],
    ["an encoded dot segment", "/%2e//evil.example"],
    ["encoded parent segments", "/%2e%2e//evil.example"],
    ["an encoded dot after a folder", "/cuenta/%2E%2E/%2E%2E//evil.example"],
  ])("falls back for %s (normalized to another site)", (_name, value) => {
    expect(safeReturnPath(value)).toBe(ACCOUNT_PATHS.home);
  });

  it.each([
    ["another site", "https://evil.example/cuenta"],
    ["another site, no path", "https://evil"],
    ["a protocol-relative URL", "//evil.example"],
    ["a short protocol-relative URL", "//evil"],
    ["a backslash trick", "/\\evil.example"],
    ["a short backslash trick", "/\\evil"],
    ["backslashes", "\\\\evil.example"],
    ["a leading backslash", "\\evil"],
    ["an encoded protocol-relative URL", "%2F%2Fevil"],
    ["encoded slashes after the first one", "/%2F%2Fevil"],
    ["an encoded backslash", "/%5Cevil"],
    ["an encoded lowercase backslash", "/%5cevil"],
    ["an encoded backslash in the query", "/cuenta?x=%5C"],
    ["a tab inside", "/\t/evil.example"],
    ["a leading tab", "\t//evil.example"],
    ["a tab between the slashes of a dot segment", "/.\t//evil.example"],
    ["a line break between slashes", "/\n/evil.example"],
    ["a carriage return between slashes", "/\r/evil.example"],
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

  it("point to the orders module's public tracking", () => {
    expect(TRACK_ORDER_PATH).toBe(ORDER_TRACKING_PATH);
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
