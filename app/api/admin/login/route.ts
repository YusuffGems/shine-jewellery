/* Admin sign-in against the shared online store → returns a signed token for saving. */
import { NextResponse } from "next/server";
import { cloudEnabled, readCloud } from "@/lib/server/cloudStore";
import { issueAdminToken } from "@/lib/server/adminToken";
import { verifyPassword } from "@/lib/auth/hash";
import { canAccessAdmin } from "@/lib/auth/rbac";
import { createSeed } from "@/lib/store/seed";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!cloudEnabled()) return NextResponse.json({ enabled: false }, { status: 503 });
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  const stored = await readCloud();
  const data = stored ?? createSeed();
  const users = data.adminUsers?.length ? data.adminUsers : createSeed().adminUsers;
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  if (!user.active || !canAccessAdmin(user.role)) return NextResponse.json({ error: "inactive" }, { status: 403 });
  const { passwordHash: _hash, ...safe } = user;
  return NextResponse.json({ ok: true, token: issueAdminToken(user.id, user.role), user: safe, firstRun: !stored });
}