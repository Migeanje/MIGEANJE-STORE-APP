// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createAttemptLimiter } from "./attempt-limiter";

function clock(start = 0) {
  let now = start;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("createAttemptLimiter", () => {
  it("blocks a key after the maximum failures inside the window", () => {
    const time = clock();
    const limiter = createAttemptLimiter({
      maxFailures: 3,
      windowMs: 60_000,
      now: time.now,
    });

    for (let failure = 0; failure < 2; failure += 1) {
      limiter.recordFailure("1.2.3.4");
    }
    expect(limiter.isBlocked("1.2.3.4")).toBe(false);

    limiter.recordFailure("1.2.3.4");
    expect(limiter.isBlocked("1.2.3.4")).toBe(true);
    expect(limiter.isBlocked("5.6.7.8")).toBe(false);
  });

  it("forgets the failures once the window is over", () => {
    const time = clock();
    const limiter = createAttemptLimiter({
      maxFailures: 2,
      windowMs: 60_000,
      now: time.now,
    });
    limiter.recordFailure("key");
    limiter.recordFailure("key");
    expect(limiter.isBlocked("key")).toBe(true);

    time.advance(59_999);
    expect(limiter.isBlocked("key")).toBe(true);
    time.advance(1);
    expect(limiter.isBlocked("key")).toBe(false);

    // A new window starts with the next failure.
    limiter.recordFailure("key");
    expect(limiter.isBlocked("key")).toBe(false);
  });

  it("drops expired keys so the memory does not grow forever", () => {
    const time = clock();
    const limiter = createAttemptLimiter({
      maxFailures: 1,
      windowMs: 1_000,
      now: time.now,
    });
    for (let key = 0; key < 50; key += 1) limiter.recordFailure(`k${key}`);
    expect(limiter.size()).toBe(50);

    time.advance(1_000);
    limiter.recordFailure("new");
    expect(limiter.size()).toBe(1);
  });

  it("throws a RangeError for limits outside their domain", () => {
    expect(() => createAttemptLimiter({ maxFailures: 0, windowMs: 1 })).toThrow(
      RangeError,
    );
    expect(() =>
      createAttemptLimiter({ maxFailures: 1.5, windowMs: 1 }),
    ).toThrow(RangeError);
    expect(() => createAttemptLimiter({ maxFailures: 1, windowMs: 0 })).toThrow(
      RangeError,
    );
  });
});
