// Who is asking, for the order lookup attempt limiter. Server-only: it reads
// the request headers and writes a cookie (only from a server action).
import "server-only";
import { cookies, headers } from "next/headers";
import { network } from "@/shared/config/network";
import { trustedForwardedAddress } from "@/shared/lib/client-address";

/** Anonymous id of this browser, for the attempt limiter only. */
export const CLIENT_ID_COOKIE = "mg_client";

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

const CLIENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** httpOnly, SameSite=Lax, Secure in production, every path, one day. */
export function clientIdCookieOptions(
  production = process.env.NODE_ENV === "production",
) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    path: "/",
    maxAge: ONE_DAY_IN_SECONDS,
  } as const;
}

export type IdentifyClientOptions = {
  /** Proxies trusted to append the client address; `network` by default. */
  trustedProxyHops?: number;
};

/**
 * The keys the attempt limiter counts for this request (only from a server
 * action, as it may set a cookie):
 * - `browser:<id>`: a random id the server issues in the httpOnly
 *   `mg_client` cookie on the first lookup (a missing or malformed value is
 *   replaced, so a client cannot pick someone else's key);
 * - `address:<ip>`: only behind trusted proxies (`network.trustedProxyHops`),
 *   the address the closest of them appended to `x-forwarded-for`.
 *
 * Forwarding headers are never trusted otherwise, so forging them neither
 * resets a client's count nor blocks another client. Without trusted
 * proxies, a client that throws its cookie away starts a new count: this
 * in-memory limiter is a best-effort guard for mock data; real rate limiting
 * belongs to the edge or the backend.
 */
export async function identifyClient({
  trustedProxyHops = network.trustedProxyHops,
}: IdentifyClientOptions = {}): Promise<string[]> {
  const jar = await cookies();
  let id = jar.get(CLIENT_ID_COOKIE)?.value.toLowerCase();
  if (!id || !CLIENT_ID.test(id)) {
    id = crypto.randomUUID();
    jar.set(CLIENT_ID_COOKIE, id, clientIdCookieOptions());
  }

  const keys = [`browser:${id}`];
  const address = trustedForwardedAddress(
    (await headers()).get("x-forwarded-for"),
    trustedProxyHops,
  );
  if (address) keys.push(`address:${address}`);
  return keys;
}
