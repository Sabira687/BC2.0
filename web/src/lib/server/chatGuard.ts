/** Pure decision logic for /api/chat: limits from env, request guard, upstream-failure mapping. */
import { COACH_RESTING_MESSAGE, tooManyMessagesText } from "@/lib/chatMessages";
import { RateLimiter } from "./rateLimit";

export interface ChatLimits {
  perIpMinute: number;
  perIpDay: number;
  globalMinute: number;
  globalDay: number;
  model: string;
}

export const DEFAULT_CHAT_MODEL = "claude-opus-5-5";

function positive(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return raw !== undefined && Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}

export function chatLimits(env: Record<string, string | undefined>): ChatLimits {
  return {
    perIpMinute: positive(env.CHAT_PER_IP_MINUTE, 40),
    perIpDay: positive(env.CHAT_PER_IP_DAY, 800),
    globalMinute: positive(env.CHAT_GLOBAL_MINUTE, 120),
    globalDay: positive(env.CHAT_GLOBAL_DAY, 3000),
    model: env.CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL,
  };
}

export type GuardResult =
  | { ok: true }
  | { ok: false; status: 429; scope: "ip" | "global"; error: string; retryAfterSec: number }
  | { ok: false; status: 503; error: string };

const DAY = 24 * 3_600_000;

export function createChatGuard(limits: ChatLimits) {
  const perIp = new RateLimiter({
    rules: [
      { windowMs: 60_000, max: limits.perIpMinute },
      { windowMs: DAY, max: limits.perIpDay },
    ],
  });
  const global = new RateLimiter({
    rules: [
      { windowMs: 60_000, max: limits.globalMinute },
      { windowMs: DAY, max: limits.globalDay },
    ],
    maxKeys: 1,
  });
  return {
    check(ip: string, now: number = Date.now()): GuardResult {
      // Global first (peek only), so a global rejection never spends the player's own budget.
      const g = global.peek("all", now);
      if (!g.ok) {
        // The day budget is gone: the coach rests. A busy minute is only a short wait.
        if (g.windowMs >= DAY) return { ok: false, status: 503, error: COACH_RESTING_MESSAGE };
        return { ok: false, status: 429, scope: "global", error: tooManyMessagesText(g.retryAfterSec), retryAfterSec: g.retryAfterSec };
      }
      const a = perIp.check(ip, now);
      if (!a.ok) return { ok: false, status: 429, scope: "ip", error: tooManyMessagesText(a.retryAfterSec), retryAfterSec: a.retryAfterSec };
      global.check("all", now);
      return { ok: true };
    },
  };
}

/** True when an Anthropic failure means "key/quota/overload", shown to players as the resting coach. */
export function isCoachRestingStatus(status: number | undefined, message: string): boolean {
  if (status === 401 || status === 403 || status === 429 || status === 529) return true;
  return /overloaded|credit balance|billing|spend limit|usage limit|quota/i.test(message);
}
