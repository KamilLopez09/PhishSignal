import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenBucket } from "@/lib/token-bucket";

describe("TokenBucket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows a burst up to capacity then rejects", () => {
    const bucket = new TokenBucket({ capacity: 3, refillRate: 1 });
    expect(bucket.take().ok).toBe(true);
    expect(bucket.take().ok).toBe(true);
    expect(bucket.take().ok).toBe(true);
    const denied = bucket.take();
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("refills tokens over time", () => {
    const bucket = new TokenBucket({ capacity: 1, refillRate: 1 });
    expect(bucket.take().ok).toBe(true);
    expect(bucket.take().ok).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(bucket.take().ok).toBe(true);
  });
});
