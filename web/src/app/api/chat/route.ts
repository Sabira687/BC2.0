/**
 * POST /api/chat — the AIGO console's only server code.
 * Streams Claude's reply as plain text. The API key lives in the server
 * environment (ANTHROPIC_API_KEY) and never reaches the browser.
 *
 * Abuse brakes: same-origin only, body/message/conversation size caps,
 * per-IP and per-instance rate limits, bounded output. Message content is
 * never logged.
 */
import Anthropic from "@anthropic-ai/sdk";
import { CONSOLE_SYSTEM_PROMPT, MAX_BODY_BYTES, validateChatBody } from "@/lib/chat";
import { COACH_RESTING_MESSAGE } from "@/lib/chatMessages";
import { chatLimits, createChatGuard, isCoachRestingStatus } from "@/lib/server/chatGuard";
import { clientIp } from "@/lib/server/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_OUTPUT_TOKENS = 8_000;

const limits = chatLimits(process.env);
const guard = createChatGuard(limits);

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ maxRetries: 1, timeout: 120_000 });
  return client;
}

function json(status: number, error: string, extra: Record<string, string> = {}, fields: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ error, ...fields }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  // x-forwarded-host may be a list behind chained proxies: the first entry is the public host.
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))?.split(",")[0]?.trim();
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Read the body as text, giving up (null) as soon as it exceeds `max` bytes. */
async function readCapped(req: Request, max: number): Promise<string | null> {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let off = 0;
  for (const c of chunks) {
    all.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return json(403, "Requests are only accepted from the AIGO site.");
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) return json(413, "Request too large.");

  const gate = guard.check(clientIp(req.headers));
  if (!gate.ok) {
    if (gate.status === 429) return json(429, gate.error, { "retry-after": String(gate.retryAfterSec) }, { retryAfterSec: gate.retryAfterSec, scope: gate.scope });
    return json(503, gate.error);
  }

  const anthropic = getClient();
  if (!anthropic) return json(503, COACH_RESTING_MESSAGE);

  const text = await readCapped(req, MAX_BODY_BYTES);
  if (text === null) return json(413, "Request too large.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, "Invalid JSON.");
  }
  const valid = validateChatBody(body);
  if (!valid.ok) return json(400, valid.error);

  const stream = anthropic.beta.messages.stream(
    {
      model: limits.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      cache_control: { type: "ephemeral" },
      system: CONSOLE_SYSTEM_PROMPT,
      messages: valid.messages,
    },
    { signal: req.signal },
  );

  // Pull the first event before answering, so key/quota/overload failures become a real 503.
  const iterator = stream[Symbol.asyncIterator]();
  let first: IteratorResult<Anthropic.Beta.Messages.BetaRawMessageStreamEvent>;
  try {
    first = await iterator.next();
  } catch (err) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    const status = err instanceof Anthropic.APIError ? err.status : undefined;
    console.error("chat upstream error", err instanceof Error ? err.name : "unknown", status ?? "");
    stream.abort();
    if (isCoachRestingStatus(status, err instanceof Error ? err.message : "")) return json(503, COACH_RESTING_MESSAGE);
    return json(502, "Something went wrong talking to Claude. Try sending again.");
  }

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let r = first; !r.done; r = await iterator.next()) {
          const event = r.value;
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        // Token counts only (cost monitoring) — never message content.
        const u = final.usage;
        console.info(
          "chat usage",
          JSON.stringify({ model: final.model, stop: final.stop_reason, in: u.input_tokens, out: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0 }),
        );
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode("\n\n[Claude declined to continue this reply.]"));
        else if (final.stop_reason === "max_tokens") controller.enqueue(encoder.encode("\n\n[Reply cut off: it got too long.]"));
      } catch (err) {
        if (!req.signal.aborted) {
          // Log the error type only — never message content.
          const status = err instanceof Anthropic.APIError ? err.status : undefined;
          console.error("chat stream error", err instanceof Error ? err.name : "unknown", status ?? "");
          const msg = isCoachRestingStatus(status, err instanceof Error ? err.message : "")
            ? COACH_RESTING_MESSAGE
            : "Something went wrong talking to Claude. Try sending again.";
          try {
            controller.enqueue(encoder.encode(`\n\n[${msg}]`));
          } catch {
            // stream already closed
          }
        }
      } finally {
        try {
          controller.close();
        } catch {
          // already closed: the client went away
        }
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body$, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
