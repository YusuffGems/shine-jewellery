/**
 * Password hashing for the mock (browser) mode.
 * SHA-256 with a per-app pepper via Web Crypto — adequate for a local demo only.
 * Phase 2: hash on the server with argon2id/bcrypt (see docs/API-INTEGRATION.md).
 */
const PEPPER = "shine.mock.v1";

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${PEPPER}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}

export function passwordStrongEnough(pw: string): boolean {
  return pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);
}
