/* SERVER ONLY — signed admin session tokens for saving to the shared online store. */
import { createHmac, timingSafeEqual } from "node:crypto";

const DAYS = 7;
const secret = () => process.env.ADMIN_SYNC_SECRET || process.env.BLOB_READ_WRITE_TOKEN || "";

const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export function issueAdminToken(userId: string, role: string): string {
  const body = Buffer.from(JSON.stringify({ uid: userId, role, exp: Date.now() + DAYS * 86_400_000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyAdminToken(token?: string | null): { uid: string; role: string } | null {
  if (!token || !secret()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as { uid: string; role: string; exp: number };
    return p.exp > Date.now() ? { uid: p.uid, role: p.role } : null;
  } catch {
    return null;
  }
}

export const bearer = (req: Request) => req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;