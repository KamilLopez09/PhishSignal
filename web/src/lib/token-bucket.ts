/**
 * Token-bucket rate limiter (client-side, FR-10).
 * capacity tokens; refillRate tokens per second.
 */
export type TokenBucketOptions = {
  capacity: number;
  /** Tokens added per second */
  refillRate: number;
};

export type TakeResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number; remaining: number };

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(private readonly opts: TokenBucketOptions) {
    this.tokens = opts.capacity;
    this.lastRefill = Date.now();
  }

  private refill(now = Date.now()) {
    const elapsedSec = (now - this.lastRefill) / 1000;
    if (elapsedSec <= 0) return;
    this.tokens = Math.min(
      this.opts.capacity,
      this.tokens + elapsedSec * this.opts.refillRate,
    );
    this.lastRefill = now;
  }

  /** Peek without consuming. */
  available(): number {
    this.refill();
    return this.tokens;
  }

  /** Try to spend one token. */
  take(): TakeResult {
    this.refill();
    if (this.tokens < 1) {
      const deficit = 1 - this.tokens;
      const retryAfterMs = Math.ceil((deficit / this.opts.refillRate) * 1000);
      return { ok: false, retryAfterMs, remaining: 0 };
    }
    this.tokens -= 1;
    return { ok: true, remaining: this.tokens };
  }
}

/** Default: burst 5 analyzes, sustained ~1 every 3s. */
export function createAnalyzeBucket() {
  return new TokenBucket({ capacity: 5, refillRate: 1 / 3 });
}
