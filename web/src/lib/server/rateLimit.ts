/**
 * Best-effort in-memory rate limiter (per server instance). On serverless
 * platforms every warm instance keeps its own counters, which is fine as a
 * basic abuse brake for a demo; it is not a billing guarantee.
 */

export interface RateRule {
  windowMs: number;
  max: number;
}

export interface RateLimiterOptions {
  rules: RateRule[];
  /** Cap on tracked keys so the map can't grow without bound. */
  maxKeys?: number;
}

/** `windowMs` names the rule that was exceeded. */
export type RateResult = { ok: true } | { ok: false; retryAfterSec: number; windowMs: number };

export class RateLimiter {
  private hits = new Map<string, number[]>();
  private readonly rules: RateRule[];
  private readonly maxKeys: number;
  private readonly longest: number;

  constructor(opts: RateLimiterOptions) {
    this.rules = opts.rules;
    this.maxKeys = opts.maxKeys ?? 10_000;
    this.longest = Math.max(...opts.rules.map((r) => r.windowMs));
  }

  /** Would a hit pass right now? Records nothing. */
  peek(key: string, now: number = Date.now()): RateResult {
    const list = this.hits.get(key) ?? [];
    for (const rule of this.rules) {
      const inWindow = list.filter((t) => now - t < rule.windowMs);
      if (inWindow.length >= rule.max) {
        const oldest = inWindow[0] ?? now;
        return { ok: false, windowMs: rule.windowMs, retryAfterSec: Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000)) };
      }
    }
    return { ok: true };
  }

  /** Record a hit for `key` at `now` unless a rule is exceeded. */
  check(key: string, now: number = Date.now()): RateResult {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.longest);
    for (const rule of this.rules) {
      const inWindow = list.filter((t) => now - t < rule.windowMs);
      if (inWindow.length >= rule.max) {
        const oldest = inWindow[0] ?? now;
        this.hits.set(key, list);
        return { ok: false, windowMs: rule.windowMs, retryAfterSec: Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000)) };
      }
    }
    list.push(now);
    this.hits.delete(key); // re-insert to keep Map order ≈ recency
    this.hits.set(key, list);
    if (this.hits.size > this.maxKeys) {
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey !== undefined) this.hits.delete(oldestKey);
    }
    return { ok: true };
  }
}

/**
 * Client IP for rate limiting. Prefer x-real-ip (set by the hosting proxy,
 * e.g. Vercel); otherwise the LAST x-forwarded-for hop, the one our own proxy
 * appended. The leftmost entries are client-controlled and easy to spoof.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  const last = headers.get("x-forwarded-for")?.split(",").pop()?.trim();
  return (real || last || "unknown").slice(0, 64);
}
