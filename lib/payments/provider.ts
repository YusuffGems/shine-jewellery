/* Provider-independent payment architecture. Card data never touches SHINE servers. */
import type { Order } from "@/types";

export interface PaymentSession {
  provider: string;
  reference: string;
  /** Hosted payment page URL (real providers) or internal mock page */
  redirectUrl: string;
  expiresAt: string;
}

export interface WebhookEvent {
  reference: string;
  orderId: string;
  status: "succeeded" | "failed" | "refunded";
  idempotencyKey: string;
  amount: number;
}

export interface PaymentProvider {
  name: string;
  createSession(order: Order): Promise<PaymentSession>;
  /** Verify signature + parse body. Must throw on invalid signatures. */
  parseWebhook(rawBody: string, signature: string | null, secret: string): Promise<WebhookEvent>;
  refund(reference: string, amount: number): Promise<{ ok: boolean; reference: string }>;
}

/** HMAC-SHA256 hex signature (works in browser, edge and node runtimes). */
export async function hmacSha256(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mock provider — simulates a hosted payment page; replace with a real Qatar gateway adapter. */
export const mockProvider: PaymentProvider = {
  name: "mock",
  async createSession(order) {
    const reference = `MOCK-${order.number}`;
    return { provider: "mock", reference, redirectUrl: `/checkout/pay/${order.id}`, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() };
  },
  async parseWebhook(rawBody, signature, secret) {
    if (!signature) throw new Error("missing_signature");
    const expected = await hmacSha256(secret, rawBody);
    if (!safeEqual(expected, signature)) throw new Error("invalid_signature");
    const evt = JSON.parse(rawBody) as WebhookEvent;
    if (!evt.reference || !evt.orderId || !evt.idempotencyKey) throw new Error("invalid_payload");
    return evt;
  },
  async refund(reference) {
    return { ok: true, reference: `${reference}-RF` };
  },
};

export function getProvider(name = "mock"): PaymentProvider {
  switch (name) {
    default:
      return mockProvider;
  }
}
