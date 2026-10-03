// @vitest-environment node
import { describe, expect, it } from "vitest";
import { network } from "./network";

describe("network", () => {
  it("trusts no forwarding header by default", () => {
    // Change this only in a reviewed commit, for a deployment where every
    // request passes through that many proxies that append the client address.
    expect(network.trustedProxyHops).toBe(0);
  });
});
