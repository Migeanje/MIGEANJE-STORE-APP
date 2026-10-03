// @vitest-environment node
import { describe, expect, it } from "vitest";
import { trustedForwardedAddress } from "./client-address";

describe("trustedForwardedAddress", () => {
  it("trusts nothing without trusted proxies, whatever the client sends", () => {
    expect(trustedForwardedAddress("203.0.113.7", 0)).toBeNull();
    expect(trustedForwardedAddress("203.0.113.7, 10.0.0.1", 0)).toBeNull();
    expect(trustedForwardedAddress(null, 0)).toBeNull();
    expect(trustedForwardedAddress(undefined, 0)).toBeNull();
  });

  it("takes the entry the closest trusted proxy appended, ignoring forged ones before it", () => {
    // The client forged "6.6.6.6"; the one proxy appended the real address.
    expect(trustedForwardedAddress("6.6.6.6, 203.0.113.7", 1)).toBe(
      "203.0.113.7",
    );
    expect(trustedForwardedAddress(" 203.0.113.7 ", 1)).toBe("203.0.113.7");
  });

  it("counts back one entry per trusted proxy", () => {
    // CDN appends the client, the load balancer appends the CDN.
    expect(
      trustedForwardedAddress("6.6.6.6, 203.0.113.7, 198.51.100.1", 2),
    ).toBe("203.0.113.7");
  });

  it("trusts nothing when the header did not pass every trusted proxy", () => {
    expect(trustedForwardedAddress("203.0.113.7", 2)).toBeNull();
    expect(trustedForwardedAddress("", 1)).toBeNull();
    expect(trustedForwardedAddress(null, 1)).toBeNull();
    expect(trustedForwardedAddress("6.6.6.6, ", 1)).toBeNull();
  });

  it("throws a RangeError for a hop count that is not a whole number from 0", () => {
    expect(() => trustedForwardedAddress("203.0.113.7", -1)).toThrow(
      RangeError,
    );
    expect(() => trustedForwardedAddress("203.0.113.7", 1.5)).toThrow(
      RangeError,
    );
    expect(() => trustedForwardedAddress("203.0.113.7", Number.NaN)).toThrow(
      RangeError,
    );
  });
});
