/**
 * One-at-a-time analyzes + token-bucket + min spacing (throttle).
 */
import { createAnalyzeBucket, type TakeResult } from "@/lib/token-bucket";

const MIN_INTERVAL_MS = 1500;

export type GateReject =
  | { kind: "busy" }
  | { kind: "throttle"; retryAfterMs: number }
  | { kind: "rate_limit"; retryAfterMs: number; remaining: number };

export class AnalyzeGate {
  private readonly bucket = createAnalyzeBucket();
  private inflight = false;
  private lastStartedAt = 0;

  /**
   * Admit at most one analyze at a time. Applies throttle then token bucket.
   */
  async runExclusive<T>(
    task: () => Promise<T>,
  ): Promise<
    | { ok: true; value: T; remaining: number }
    | { ok: false; reject: GateReject }
  > {
    if (this.inflight) {
      return { ok: false, reject: { kind: "busy" } };
    }

    const now = Date.now();
    const since = now - this.lastStartedAt;
    if (this.lastStartedAt > 0 && since < MIN_INTERVAL_MS) {
      return {
        ok: false,
        reject: {
          kind: "throttle",
          retryAfterMs: MIN_INTERVAL_MS - since,
        },
      };
    }

    const take: TakeResult = this.bucket.take();
    if (!take.ok) {
      return {
        ok: false,
        reject: {
          kind: "rate_limit",
          retryAfterMs: take.retryAfterMs,
          remaining: take.remaining,
        },
      };
    }

    this.inflight = true;
    this.lastStartedAt = Date.now();
    try {
      const value = await task();
      return { ok: true, value, remaining: take.remaining };
    } finally {
      this.inflight = false;
    }
  }

  remainingTokens(): number {
    return Math.floor(this.bucket.available());
  }
}

export function formatGateError(reject: GateReject): string {
  switch (reject.kind) {
    case "busy":
      return "An analyze is already running — wait for it to finish";
    case "throttle":
      return `Slow down — try again in ${(reject.retryAfterMs / 1000).toFixed(1)}s`;
    case "rate_limit":
      return `Rate limited — try again in ${Math.ceil(reject.retryAfterMs / 1000)}s`;
  }
}
