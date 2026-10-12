/* Which parts of the database are shared online, and who may see them. */
import type { Database } from "@/types";

export const PRIVATE_KEYS = ["customers", "orders", "appointments", "personalisation", "adminUsers", "loginHistory", "audit", "notifications", "analytics"] as const;
export const LOCAL_KEYS = ["session"] as const;

type AnyDb = Partial<Database>;

export function stripSecrets(d: AnyDb): AnyDb {
  const out: AnyDb = { ...d };
  if (out.adminUsers) out.adminUsers = out.adminUsers.map(({ passwordHash: _p, ...u }) => ({ ...u, passwordHash: "" }));
  if (out.customers) out.customers = out.customers.map(({ passwordHash: _p, ...c }) => ({ ...c, passwordHash: "" }));
  return out;
}

export function publicView(d: AnyDb, isAdmin: boolean): AnyDb {
  const out: AnyDb = stripSecrets(d);
  delete out.session;
  if (!isAdmin) for (const k of PRIVATE_KEYS) delete out[k];
  return out;
}

export function keepHashes(incoming: AnyDb, existing: AnyDb): AnyDb {
  const out: AnyDb = { ...incoming };
  if (out.adminUsers) {
    out.adminUsers = out.adminUsers.map((u) => (u.passwordHash ? u : { ...u, passwordHash: existing.adminUsers?.find((e) => e.id === u.id)?.passwordHash ?? "" }));
  }
  if (out.customers) {
    out.customers = out.customers.map((c) => (c.passwordHash ? c : { ...c, passwordHash: existing.customers?.find((e) => e.id === c.id)?.passwordHash ?? "" }));
  }
  return out;
}