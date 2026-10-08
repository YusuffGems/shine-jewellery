/* USER APP — customer accounts (separate from admin accounts). */
import { db } from "@/lib/store/db";
import { hashPassword, passwordStrongEnough, verifyPassword } from "@/lib/auth/hash";
import { isEmail, nowIso, uid } from "@/lib/utils";
import { queueNotification } from "@/shared/services/core";
import type { Address, Customer } from "@/types";

/* ── Customer ──────────────────────────────────────────────── */
export async function registerCustomer(name: string, email: string, phone: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!name.trim() || !isEmail(email)) return { ok: false, error: "invalid" };
  if (!passwordStrongEnough(password)) return { ok: false, error: "weak_password" };
  const lower = email.trim().toLowerCase();
  if (db.get().customers.some((c) => c.email === lower)) return { ok: false, error: "exists" };
  const passwordHash = await hashPassword(password);
  const customer: Customer = { id: uid("cus"), name: name.trim(), email: lower, phone: phone.trim(), passwordHash, addresses: [], createdAt: nowIso() };
  db.update((d) => {
    d.customers.push(customer);
    d.session.customerId = customer.id;
    queueNotification(d, "email", "account_created", customer.email, "Welcome to SHINE");
  });
  return { ok: true };
}

export async function loginCustomer(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const c = db.get().customers.find((x) => x.email === email.trim().toLowerCase());
  const ok = !!c && (await verifyPassword(password, c.passwordHash));
  db.update((d) => {
    d.loginHistory.unshift({ id: uid("lh"), email, success: ok, at: nowIso(), area: "customer" });
    if (ok && c) d.session.customerId = c.id;
  });
  return ok ? { ok: true } : { ok: false, error: "invalid_credentials" };
}

export function logoutCustomer() {
  db.update((d) => {
    d.session.customerId = undefined;
  });
}

export function updateCustomerProfile(id: string, data: Pick<Customer, "name" | "phone">) {
  db.update((d) => {
    const c = d.customers.find((x) => x.id === id);
    if (c) Object.assign(c, { name: data.name.trim(), phone: data.phone.trim() });
  });
}

export function saveAddress(customerId: string, address: Address) {
  db.update((d) => {
    const c = d.customers.find((x) => x.id === customerId);
    if (!c) return;
    const i = c.addresses.findIndex((a) => a.id === address.id);
    if (i >= 0) c.addresses[i] = address;
    else c.addresses.push(address);
  });
}

export function deleteAddress(customerId: string, addressId: string) {
  db.update((d) => {
    const c = d.customers.find((x) => x.id === customerId);
    if (c) c.addresses = c.addresses.filter((a) => a.id !== addressId);
  });
}

export async function changeCustomerPassword(id: string, current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  const c = db.get().customers.find((x) => x.id === id);
  if (!c || !(await verifyPassword(current, c.passwordHash))) return { ok: false, error: "invalid_credentials" };
  if (!passwordStrongEnough(next)) return { ok: false, error: "weak_password" };
  const passwordHash = await hashPassword(next);
  db.update((d) => {
    const x = d.customers.find((y) => y.id === id);
    if (x) x.passwordHash = passwordHash;
  });
  return { ok: true };
}
