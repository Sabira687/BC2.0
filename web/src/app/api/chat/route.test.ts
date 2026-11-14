import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SSE = (events: object[]) =>
  events.map((e: any) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
const msgStart = { type: "message_start", message: { id: "m", type: "message", role: "assistant", model: "x", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 0 } } };
const okEvents = [
  msgStart,
  { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
  { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hel" } },
  { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "lo" } },
  { type: "content_block_stop", index: 0 },
  { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 2 } },
  { type: "message_stop" },
];

function req(signal?: AbortSignal) {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { origin: "http://localhost:3000", host: "localhost:3000", "content-type": "application/json", "x-real-ip": "9.9.9." + Math.random() },
    body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
    signal,
  });
}

const RESTING = "The live coach is resting. Copy an item from your collection into your own Claude: it works the same.";

describe("POST /api/chat", () => {
  beforeEach(() => { vi.resetModules(); vi.spyOn(console, "info").mockImplementation(() => {}); vi.spyOn(console, "error").mockImplementation(() => {}); });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it("no key -> 503 resting", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { POST } = await import("@/app/api/chat/route");
    const r = await POST(req());
    expect(r.status).toBe(503);
    expect((await r.json()).error).toBe(RESTING);
  });

  for (const [status, body] of [[401, { type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }], [403, { type: "error", error: { type: "permission_error", message: "nope" } }], [400, { type: "error", error: { type: "invalid_request_error", message: "Your credit balance is too low to access the Anthropic API." } }], [500, { type: "error", error: { type: "api_error", message: "internal secret detail" } }]] as const) {
    it(`upstream ${status} mapping`, async () => {
      vi.stubEnv("ANTHROPIC_API_KEY", "test-fake");
      const f = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
      vi.stubGlobal("fetch", f);
      const { POST } = await import("@/app/api/chat/route");
      const r = await POST(req());
      const j = await r.json();
      if (status === 500) { expect(r.status).toBe(502); expect(JSON.stringify(j)).not.toContain("secret"); }
      else { expect(r.status).toBe(503); expect(j.error).toBe(RESTING); }
    }, 60000);
  }

  it("upstream 429 (with retry-after 0) -> 503", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-fake");
    const f = vi.fn(async () => new Response(JSON.stringify({ type: "error", error: { type: "rate_limit_error", message: "rl" } }), { status: 429, headers: { "content-type": "application/json", "retry-after-ms": "1" } }));
    vi.stubGlobal("fetch", f);
    const { POST } = await import("@/app/api/chat/route");
    const r = await POST(req());
    expect(r.status).toBe(503);
  }, 60000);

  it("streams all chunks, first chunk not lost or duplicated", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-fake");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(SSE(okEvents), { status: 200, headers: { "content-type": "text/event-stream" } })));
    const { POST } = await import("@/app/api/chat/route");
    const r = await POST(req());
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("Hello");
  });

  it("first event as a text delta right away (slow trickle) streams correctly", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-fake");
    const enc = new TextEncoder();
    const parts = SSE(okEvents).split("\n\n").filter(Boolean).map((p) => p + "\n\n");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream({ async pull(c) { const p = parts.shift(); if (!p) return c.close(); await new Promise((r) => setTimeout(r, 20)); c.enqueue(enc.encode(p)); } }), { status: 200, headers: { "content-type": "text/event-stream" } })));
    const { POST } = await import("@/app/api/chat/route");
    const r = await POST(req());
    expect(await r.text()).toBe("Hello");
  });

  it("mid-stream overloaded error appends resting text", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-fake");
    const s = SSE(okEvents.slice(0, 3)) + `event: error\ndata: ${JSON.stringify({ type: "error", error: { type: "overloaded_error", message: "Overloaded" } })}\n\n`;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(s, { status: 200, headers: { "content-type": "text/event-stream" } })));
    const { POST } = await import("@/app/api/chat/route");
    const r = await POST(req());
    const t = await r.text();
    expect(t).toContain(RESTING);
  });

  it("client abort while waiting for first event -> resolves (no hang)", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-fake");
    vi.stubGlobal("fetch", vi.fn((_u: any, init: any) => new Promise((_res, rej) => { init?.signal?.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "AbortError" }))); })));
    const { POST } = await import("@/app/api/chat/route");
    const ac = new AbortController();
    const p = POST(req(ac.signal));
    setTimeout(() => ac.abort(), 50);
    const r = await p;
    expect(r.status).toBe(499);
  });

  it("41st request from one IP in a minute -> 429 with Retry-After", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { POST } = await import("@/app/api/chat/route");
    const mk = () => new Request("http://localhost:3000/api/chat", { method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000", "x-real-ip": "5.5.5.5" }, body: "{}" });
    for (let i = 0; i < 40; i++) expect((await POST(mk())).status).toBe(503);
    const r = await POST(mk());
    expect(r.status).toBe(429);
    expect(Number(r.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await r.json()).toMatchObject({ scope: "ip" });
  });
});
