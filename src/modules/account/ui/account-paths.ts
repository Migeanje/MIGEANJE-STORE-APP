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

/**
 * Public order tracking (number + email), a page of the orders module; the
 * account never imports orders (a test keeps both paths equal).
 */
export const TRACK_ORDER_PATH = "/pedidos/seguimiento";

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

/** `%5C` (backslash) anywhere; `%2F` (slash) in the path. */
const ENCODED_BACKSLASH = /%5c/i;
const ENCODED_SLASH = /%2f/i;

/** `value` resolved on BASE (normalized), or null when it leaves the site. */
function resolveOnSite(value: string): URL | null {
  try {
    const url = new URL(value, BASE);
    return url.origin === BASE ? url : null;
  } catch {
    return null;
  }
}

/**
 * A `?volver=` value, if it is a path of this site; `fallback` otherwise.
 * Refuses anything that could leave the site (absolute and
 * protocol-relative URLs, backslash tricks, control characters that URL
 * parsers drop) and the sign-in pages themselves (no loops). The path comes
 * back normalized (`/a/../b` is `/b`), and the checks look at that
 * normalized path: `/.//evil.example` normalizes to `//evil.example`, which
 * a browser reads as another site.
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
  const url = resolveOnSite(value);
  if (!url) return fallback;
  const { pathname } = url;
  const path = `${pathname}${url.search}${url.hash}`;
  if (
    pathname.startsWith("//") ||
    pathname.includes("\\") ||
    ENCODED_SLASH.test(pathname) ||
    ENCODED_BACKSLASH.test(path) ||
    AUTH_PATHS.includes(pathname) ||
    // Followed as given (a Location header), it must land on itself.
    resolveOnSite(path)?.href !== url.href
  ) {
    return fallback;
  }
  return path;
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
