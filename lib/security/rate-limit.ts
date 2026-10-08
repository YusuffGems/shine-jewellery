/** Simple in-memory sliding-window rate limiter for API routes (swap for Redis/Upstash in production). */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, remaining: 0 };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true, remaining: limit - recent.length };
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "anonymous";
}
