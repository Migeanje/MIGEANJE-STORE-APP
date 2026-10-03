// Who is asking, for the tracking attempt limiter. Server-only: it reads the
// request headers.
import "server-only";
import { headers } from "next/headers";

/**
 * The client address of this request: the first `x-forwarded-for` entry
 * (Next sets it from the socket), then `x-real-ip`, else one shared key.
 *
 * Good enough for the in-memory mock limiter only: without a trusted proxy
 * in front, a client can send its own `x-forwarded-for`. Real rate limiting
 * belongs to the edge or the backend (F3+).
 */
export async function readClientKey(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || list.get("x-real-ip")?.trim() || "unknown";
}
