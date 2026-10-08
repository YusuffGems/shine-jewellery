/* Shared data helpers used by BOTH apps: generic CRUD, audit log, notifications, analytics. */
import { db } from "@/lib/store/db";
import type { AnalyticsEvent, Database, NotificationEntry } from "@/types";
import { nowIso, uid } from "@/lib/utils";

export type EntityKey = {
  [K in keyof Database]: Database[K] extends Array<{ id: string }> ? K : never;
}[keyof Database];

export type EntityOf<K extends EntityKey> = Database[K] extends Array<infer T> ? T : never;

export function actor(d: Database): string {
  const admin = d.adminUsers.find((u) => u.id === d.session.adminId);
  if (admin) return admin.email;
  const cust = d.customers.find((c) => c.id === d.session.customerId);
  return cust ? `customer:${cust.email}` : "guest";
}

export const trim = (v: unknown) => {
  if (v === undefined) return undefined;
  const s = JSON.stringify(v);
  return s.length > 1500 ? `${s.slice(0, 1500)}…` : s;
};

export function writeAudit(d: Database, action: string, entity: string, entityId: string, oldValue?: unknown, newValue?: unknown) {
  d.audit.unshift({ id: uid("aud"), user: actor(d), action, entity, entityId, oldValue: trim(oldValue), newValue: trim(newValue), ip: "client (mock)", at: nowIso() });
  if (d.audit.length > 1000) d.audit.length = 1000;
}

export function upsertEntity<K extends EntityKey>(key: K, item: EntityOf<K>) {
  db.update((d) => {
    const list = d[key] as unknown as Array<{ id: string }>;
    const it = item as unknown as { id: string };
    const idx = list.findIndex((x) => x.id === it.id);
    if (idx >= 0) {
      writeAudit(d, "update", String(key), it.id, list[idx], it);
      list[idx] = it;
    } else {
      writeAudit(d, "create", String(key), it.id, undefined, it);
      list.push(it);
    }
  });
}

export function removeEntity<K extends EntityKey>(key: K, id: string) {
  db.update((d) => {
    const list = d[key] as unknown as Array<{ id: string }>;
    const idx = list.findIndex((x) => x.id === id);
    if (idx < 0) return;
    writeAudit(d, "delete", String(key), id, list[idx]);
    list.splice(idx, 1);
  });
}

export function queueNotification(d: Database, channel: NotificationEntry["channel"], event: string, to: string, message: string) {
  if (!to) return;
  d.notifications.unshift({ id: uid("ntf"), channel, event, to, message, at: nowIso(), status: "queued" });
  if (d.notifications.length > 500) d.notifications.length = 500;
}

export function track(event: string, data: AnalyticsEvent["data"] = {}) {
  db.update((d) => {
    d.analytics.unshift({ id: uid("evt"), event, data, at: nowIso() });
    if (d.analytics.length > 800) d.analytics.length = 800;
  });
}
