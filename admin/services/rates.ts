/* ADMIN APP — metal rate updates and live-provider sync. */
import { db } from "@/lib/store/db";
import { nowIso, round2, uid } from "@/lib/utils";
import { actor, writeAudit } from "@/shared/services/core";
import type { MetalRate } from "@/types";

export function updateRate(rateId: string, ratePerGram: number, source = "Manual entry") {
  if (!Number.isFinite(ratePerGram) || ratePerGram <= 0) throw new Error("invalid_rate");
  db.update((d) => {
    const r = d.rates.find((x) => x.id === rateId);
    if (!r) return;
    const old = { ...r };
    r.ratePerGram = round2(ratePerGram);
    r.updatedAt = nowIso();
    r.source = source;
    r.status = "manual";
    d.rateHistory.unshift({ id: uid("rh"), rateId, ratePerGram: r.ratePerGram, at: r.updatedAt, by: actor(d) });
    writeAudit(d, "update", "rates", rateId, old.ratePerGram, r.ratePerGram);
  });
}

/**
 * Live provider hook. In API mode the server polls METAL_RATES_API_URL and
 * writes MetalRate rows with status "live". Never invent values here.
 */
export interface MetalRateProvider {
  name: string;
  fetchRates(): Promise<Pick<MetalRate, "id" | "ratePerGram">[]>;
}

export async function syncFromProvider(provider: MetalRateProvider) {
  const rows = await provider.fetchRates();
  db.update((d) => {
    for (const row of rows) {
      const r = d.rates.find((x) => x.id === row.id);
      if (!r) continue;
      r.ratePerGram = round2(row.ratePerGram);
      r.updatedAt = nowIso();
      r.source = provider.name;
      r.status = "live";
      d.rateHistory.unshift({ id: uid("rh"), rateId: r.id, ratePerGram: r.ratePerGram, at: r.updatedAt, by: provider.name });
    }
  });
}
