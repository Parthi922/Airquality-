export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSec: number;
}

/**
 * Fixed/sliding hybrid in-memory rate limiter keyed by client IP and route bucket.
 * In multi-instance serverless deployments, swap with Upstash Redis rate limiting.
 */
export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(key: string, now: number = Date.now()): RateLimitResult {
    const windowStart = now - this.windowMs;
    const existing = this.buckets.get(key) ?? [];
    const active = existing.filter((ts) => ts > windowStart);

    if (active.length >= this.maxRequests) {
      const oldestActive = active[0] ?? now;
      const resetAtMs = oldestActive + this.windowMs;
      const retryAfterSec = Math.max(1, Math.ceil((resetAtMs - now) / 1000));
      this.buckets.set(key, active);
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetAtMs,
        retryAfterSec,
      };
    }

    active.push(now);
    this.buckets.set(key, active);
    const resetAtMs = (active[0] ?? now) + this.windowMs;
    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - active.length),
      resetAtMs,
      retryAfterSec: 0,
    };
  }

  reset(): void {
    this.buckets.clear();
  }
}
