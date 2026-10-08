/* ADMIN APP — CMS, navigation, translations, settings, appointment & request statuses. */
import { db } from "@/lib/store/db";
import { queueNotification, writeAudit } from "@/shared/services/core";
import type { Appointment, Cms, HomeSection, Lang, NavItem, PersonalisationRequest, Settings } from "@/types";

export function saveSection(section: HomeSection) {
  db.update((d) => {
    const i = d.cms.sections.findIndex((s) => s.id === section.id);
    writeAudit(d, "update", "cms.sections", section.id, d.cms.sections[i], section);
    if (i >= 0) d.cms.sections[i] = section;
  });
}

export function moveSection(id: string, dir: -1 | 1) {
  db.update((d) => {
    const list = d.cms.sections;
    const i = list.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    writeAudit(d, "reorder", "cms.sections", id);
  });
}

export function toggleSection(id: string) {
  db.update((d) => {
    const s = d.cms.sections.find((x) => x.id === id);
    if (s) s.enabled = !s.enabled;
    writeAudit(d, "toggle", "cms.sections", id, undefined, s?.enabled);
  });
}

export function saveCmsField<K extends keyof Cms>(key: K, value: Cms[K]) {
  db.update((d) => {
    writeAudit(d, "update", `cms.${String(key)}`, String(key), d.cms[key], value);
    d.cms[key] = value;
  });
}

export function saveNavItem(item: NavItem) {
  db.update((d) => {
    const i = d.cms.navigation.findIndex((n) => n.id === item.id);
    if (i >= 0) d.cms.navigation[i] = item;
    else d.cms.navigation.push(item);
    d.cms.navigation.sort((a, b) => a.sort - b.sort);
    writeAudit(d, i >= 0 ? "update" : "create", "cms.navigation", item.id);
  });
}

export function deleteNavItem(id: string) {
  db.update((d) => {
    d.cms.navigation = d.cms.navigation.filter((n) => n.id !== id);
    writeAudit(d, "delete", "cms.navigation", id);
  });
}

export function setTranslation(lang: Lang, key: string, value: string) {
  db.update((d) => {
    if (value.trim()) d.translations[lang][key] = value;
    else delete d.translations[lang][key];
    writeAudit(d, "update", "translations", `${lang}:${key}`, undefined, value);
  });
}

export function saveSettings(settings: Settings) {
  db.update((d) => {
    writeAudit(d, "update", "settings", "settings", d.settings, settings);
    d.settings = settings;
  });
}

export function setAppointmentStatus(id: string, status: Appointment["status"]) {
  db.update((d) => {
    const a = d.appointments.find((x) => x.id === id);
    if (!a) return;
    writeAudit(d, "status", "appointments", id, a.status, status);
    a.status = status;
    queueNotification(d, "email", `appointment_${status}`, a.email, `Your appointment is ${status}`);
  });
}

export function setPersonalisationStatus(id: string, status: PersonalisationRequest["status"]) {
  db.update((d) => {
    const p = d.personalisation.find((x) => x.id === id);
    if (p) p.status = status;
    writeAudit(d, "status", "personalisation", id, undefined, status);
  });
}
