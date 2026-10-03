/** The account pages. */
export const ACCOUNT_PATHS = {
  home: "/cuenta",
  logIn: "/cuenta/ingresar",
  register: "/cuenta/registro",
  recover: "/cuenta/recuperar",
  profile: "/cuenta/perfil",
  addresses: "/cuenta/direcciones",
  orders: "/cuenta/pedidos",
  favorites: "/cuenta/favoritos",
} as const;

/** Where to go after signing in: `?volver=/productos/...`. */
export const RETURN_PARAM = "volver";
/** A confirmation to show after a change: `?aviso=perfil-guardado`. */
export const NOTICE_PARAM = "aviso";

const MAX_RETURN_LENGTH = 512;
// Any base works: only a same-origin result is accepted.
const BASE = "https://migeanje.invalid";
const AUTH_PATHS: readonly string[] = [
  ACCOUNT_PATHS.logIn,
  ACCOUNT_PATHS.register,
  ACCOUNT_PATHS.recover,
];
/** C0 controls, DEL and C1 controls (URL parsers drop tabs and newlines). */
function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

/**
 * A `?volver=` value, if it is a path of this site; `fallback` otherwise.
 * Refuses anything that could leave the site (absolute and
 * protocol-relative URLs, backslash tricks, control characters that URL
 * parsers drop) and the sign-in pages themselves (no loops). The path comes
 * back normalized (`/a/../b` is `/b`).
 */
export function safeReturnPath(
  value: unknown,
  fallback: string = ACCOUNT_PATHS.home,
): string {
  if (
    typeof value !== "string" ||
    value.length > MAX_RETURN_LENGTH ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    hasControlCharacter(value)
  ) {
    return fallback;
  }
  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE || AUTH_PATHS.includes(url.pathname)) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

function withReturn(path: string, returnTo: string | null | undefined) {
  const target = safeReturnPath(returnTo);
  return target === ACCOUNT_PATHS.home
    ? path
    : `${path}?${new URLSearchParams({ [RETURN_PARAM]: target })}`;
}

/** The sign-in page, coming back to `returnTo` (a safe path) afterwards. */
export function logInHref(returnTo?: string | null): string {
  return withReturn(ACCOUNT_PATHS.logIn, returnTo);
}

/** The registration page, coming back to `returnTo` afterwards. */
export function registerHref(returnTo?: string | null): string {
  return withReturn(ACCOUNT_PATHS.register, returnTo);
}

/** `path?aviso=<key>`: the page shows the matching confirmation. */
export function withNotice(path: string, notice: string): string {
  return `${path}?${new URLSearchParams({ [NOTICE_PARAM]: notice })}`;
}

/** The notice of `?aviso=` when it is one of `notices`, else null. */
export function noticeFrom(
  searchParams: Record<string, string | string[] | undefined>,
  notices: Readonly<Record<string, string>>,
): string | null {
  const key = searchParams[NOTICE_PARAM];
  return typeof key === "string" && Object.hasOwn(notices, key)
    ? (notices[key] ?? null)
    : null;
}
