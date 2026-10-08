/* USER APP — reviews, newsletter, appointments, personalisation requests. */
import { db } from "@/lib/store/db";
import type { Review, Appointment, PersonalisationRequest } from "@/types";
import { nowIso, uid } from "@/lib/utils";
import { queueNotification, track } from "@/shared/services/core";

export function addReview(productId: string, name: string, rating: number, text: string) {
  const r: Review = { id: uid("rv"), productId, name, rating, text, approved: false, createdAt: nowIso() };
  db.update((d) => {
    d.reviews.unshift(r);
  });
}

export function subscribeNewsletter(email: string) {
  db.update((d) => {
    queueNotification(d, "email", "newsletter_subscribed", email, "Newsletter subscription confirmed");
  });
  track("newsletter_subscribe", {});
}

/* ── Appointments ──────────────────────────────────────────── */
export function bookAppointment(data: Omit<Appointment, "id" | "status" | "createdAt">): string {
  const id = uid("apt");
  db.update((d) => {
    d.appointments.unshift({ ...data, id, status: "requested", createdAt: nowIso() });
    queueNotification(d, "email", "appointment_requested", data.email, `Appointment request for ${data.date} ${data.time}`);
    queueNotification(d, "whatsapp", "appointment_requested", data.phone, `SHINE appointment requested: ${data.date} ${data.time}`);
  });
  track("appointment_booked", { branchId: data.branchId, service: data.service });
  return id;
}

/** Slots in 30-minute steps; Fridays open later (placeholder hours, configure per showroom later). */
export function timeSlots(date: string): string[] {
  const day = new Date(`${date}T12:00:00`).getDay();
  const [start, end] = day === 5 ? [16, 22] : [10, 22];
  const out: string[] = [];
  for (let h = start; h < end; h++) out.push(`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`);
  return out;
}

export function bookedSlots(branchId: string, date: string): string[] {
  return db.get().appointments.filter((a) => a.branchId === branchId && a.date === date && a.status !== "cancelled").map((a) => a.time);
}

/* ── Personalisation ───────────────────────────────────────── */
export function submitPersonalisation(data: Omit<PersonalisationRequest, "id" | "status" | "createdAt">): string {
  const id = uid("per");
  db.update((d) => {
    d.personalisation.unshift({ ...data, id, status: "new", createdAt: nowIso() });
    queueNotification(d, "email", "personalisation_received", data.email, "We received your personalisation request");
  });
  return id;
}
