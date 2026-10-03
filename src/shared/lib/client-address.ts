/**
 * The client address that trusted proxies wrote into `x-forwarded-for`, or
 * null when nothing in it can be trusted.
 *
 * Each proxy appends the address it received the request from, so with
 * `trustedProxyHops` proxies in front of the server the client is the entry
 * that many places from the end. Everything before it may have been written
 * by the client and is ignored. With 0 hops nothing is trusted; a header with
 * fewer entries than hops did not pass every trusted proxy, so it is not
 * trusted either. Throws a RangeError for a hop count that is not a whole
 * number from 0 (a configuration error).
 */
export function trustedForwardedAddress(
  forwardedFor: string | null | undefined,
  trustedProxyHops: number,
): string | null {
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 0) {
    throw new RangeError(
      `trustedProxyHops must be a whole number from 0, got ${trustedProxyHops}`,
    );
  }
  if (trustedProxyHops === 0 || !forwardedFor) return null;
  const entries = forwardedFor.split(",").map((entry) => entry.trim());
  if (entries.length < trustedProxyHops) return null;
  return entries[entries.length - trustedProxyHops] || null;
}
