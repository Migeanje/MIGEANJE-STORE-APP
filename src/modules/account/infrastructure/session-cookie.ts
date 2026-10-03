// The session cookie. Server-only: Server Components read it, server actions
// write it.
import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "mg_session";

// A sanity check before any lookup: base64url-ish, bounded length.
const TOKEN_SHAPE = /^[\w.~-]{16,512}$/;

/**
 * httpOnly (no script can read it), SameSite=Lax, Secure in production,
 * every path, until the session expires (7 days).
 */
export function sessionCookieOptions(
  expires: Date,
  production = process.env.NODE_ENV === "production",
) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    path: "/",
    expires,
  } as const;
}

/** The session token of this browser, or null (missing or malformed). */
export async function readSessionToken(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  return TOKEN_SHAPE.test(value) ? value : null;
}

/** Only from a server action: remembers a new session in this browser. */
export async function writeSessionToken(
  token: string,
  expires: Date,
): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expires));
}

/** Only from a server action: forgets this browser's session. */
export async function clearSessionToken(): Promise<void> {
  const { expires: _expires, ...options } = sessionCookieOptions(new Date(0));
  (await cookies()).set(SESSION_COOKIE, "", { ...options, maxAge: 0 });
}
