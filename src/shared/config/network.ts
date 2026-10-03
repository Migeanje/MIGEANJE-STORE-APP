/*
 * How far the storefront trusts forwarding headers. In code, like the
 * feature flags, so trusting a proxy is a reviewed change.
 *
 * - `trustedProxyHops`: how many proxies in front of the server append the
 *   address they received the request from to `x-forwarded-for`. 0, the
 *   default, trusts no forwarding header at all: a client can send its own
 *   `x-forwarded-for` (or `x-real-ip`), and Next.js only fills
 *   `x-forwarded-for` from the socket when the client sent none
 *   (`??=` in its base server), so the socket address is not reliable either.
 *   Set it to the number of proxies only for a deployment where every request
 *   passes through them (e.g. 1 behind one load balancer that appends the
 *   client address). With 0, the order lookup limiter keys by an anonymous
 *   browser id only. Real rate limiting belongs to the edge or the backend.
 */
export type Network = {
  readonly trustedProxyHops: number;
};

export const network: Network = {
  trustedProxyHops: 0,
};
