/* ADMIN APP — admin login/session (separate from customer accounts). */
import { db } from "@/lib/store/db";
import { hashPassword, passwordStrongEnough, verifyPassword } from "@/lib/auth/hash";
import { canAccessAdmin } from "@/lib/auth/rbac";
import { nowIso, uid } from "@/lib/utils";
import { writeAudit } from "@/shared/services/core";

const MAX_ATTEMPTS = 5;

const LOCK_MINUTES = 15;

/* ── Admin ─────────────────────────────────────────────────── */
export async function loginAdmin(email: string, password: string, remember: boolean): Promise<{ ok: boolean; error?: "invalid_credentials" | "locked" | "inactive" }> {
  const lower = email.trim().toLowerCase();
  const u = db.get().adminUsers.find((x) => x.email === lower);
  if (u?.lockedUntil && Date.parse(u.lockedUntil) > Date.now()) return { ok: false, error: "locked" };
  const ok = !!u && (await verifyPassword(password, u.passwordHash));
  let result: { ok: boolean; error?: "invalid_credentials" | "locked" | "inactive" } = { ok: true };
  db.update((d) => {
    d.loginHistory.unshift({ id: uid("lh"), email: lower, success: ok && !!u?.active, at: nowIso(), area: "admin" });
    const user = d.adminUsers.find((x) => x.email === lower);
    if (!user || !ok) {
      if (user) {
        user.failedAttempts += 1;
        if (user.failedAttempts >= MAX_ATTEMPTS) {
          user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
          user.failedAttempts = 0;
        }
      }
      result = { ok: false, error: "invalid_credentials" };
      return;
    }
    if (!user.active || !canAccessAdmin(user.role)) {
      result = { ok: false, error: "inactive" };
      return;
    }
    user.failedAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = nowIso();
    d.session.adminId = user.id;
    d.session.adminExpiresAt = new Date(Date.now() + (remember ? 7 * 24 : 8) * 3_600_000).toISOString();
    writeAudit(d, "login", "adminUsers", user.id);
  });
  return result;
}

export function logoutAdmin() {
  db.update((d) => {
    writeAudit(d, "logout", "adminUsers", d.session.adminId ?? "");
    d.session.adminId = undefined;
    d.session.adminExpiresAt = undefined;
  });
}

export async function setAdminPassword(userId: string, password: string): Promise<boolean> {
  if (!passwordStrongEnough(password)) return false;
  const hash = await hashPassword(password);
  db.update((d) => {
    const u = d.adminUsers.find((x) => x.id === userId);
    if (u) u.passwordHash = hash;
    writeAudit(d, "password_reset", "adminUsers", userId);
  });
  return true;
}
